import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { rateLimit, rateLimitConfigs, getRateLimitIdentifier, createRateLimitResponse } from "@/app/lib/rate-limit";
import { validateUploadedFile, fileValidationConfigs } from "@/app/lib/file-validation";

// File upload API with comprehensive security
export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        // Authentication required
        const user = await requireAuth();

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const uploadType = formData.get('type') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate upload type
        const validTypes = ['logo', 'image', 'document'] as const;
        if (!uploadType || !validTypes.includes(uploadType as typeof validTypes[number])) {
            return NextResponse.json(
                { success: false, error: "Invalid upload type" },
                { status: 400 }
            );
        }

        // Validate file
        const validation = await validateUploadedFile(file, uploadType as keyof typeof fileValidationConfigs);

        if (!validation.isValid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const userId = user.id.slice(0, 8); // First 8 chars of user ID
        const fileExtension = validation.sanitizedFilename?.split('.').pop() || 'bin';
        const uniqueFilename = `${uploadType}_${userId}_${timestamp}.${fileExtension}`;

        // In a real implementation, you would:
        // 1. Upload to cloud storage (AWS S3, Cloudinary, etc.)
        // 2. Scan for malware
        // 3. Generate thumbnails if needed
        // 4. Store metadata in database

        // For now, simulate successful upload
        const uploadUrl = `/uploads/${uniqueFilename}`;

        // Log upload for security monitoring
        console.log(`File uploaded by user ${user.id}: ${file.name} -> ${uniqueFilename}`);

        return NextResponse.json({
            success: true,
            url: uploadUrl,
            filename: uniqueFilename,
            originalName: file.name,
            size: file.size,
            type: file.type
        });

    } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }

        console.error("Error in file upload:", error);
        return NextResponse.json(
            { success: false, error: "Upload failed" },
            { status: 500 }
        );
    }
}

// Get upload limits for client-side validation
export async function GET(req: NextRequest) {
    try {
        // Rate limiting
        const identifier = getRateLimitIdentifier(req);
        const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult.resetTime);
        }

        // Return upload configuration (safe to be public)
        const config = {
            maxSizes: {
                logo: fileValidationConfigs.logo.maxSize,
                image: fileValidationConfigs.image.maxSize,
                document: fileValidationConfigs.document.maxSize
            },
            allowedTypes: {
                logo: fileValidationConfigs.logo.allowedTypes,
                image: fileValidationConfigs.image.allowedTypes,
                document: fileValidationConfigs.document.allowedTypes
            },
            allowedExtensions: {
                logo: fileValidationConfigs.logo.allowedExtensions,
                image: fileValidationConfigs.image.allowedExtensions,
                document: fileValidationConfigs.document.allowedExtensions
            }
        };

        return NextResponse.json({ success: true, config });

    } catch (error) {
        console.error("Error fetching upload config:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch upload configuration" },
            { status: 500 }
        );
    }
}