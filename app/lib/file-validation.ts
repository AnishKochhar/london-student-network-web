export interface FileValidationConfig {
	maxSize: number; // in bytes
	allowedTypes: readonly string[];
	allowedExtensions: readonly string[];
}

export const fileValidationConfigs = {
	image: {
		maxSize: 5 * 1024 * 1024, // 5MB
		allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
		allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif']
	},
	logo: {
		maxSize: 2 * 1024 * 1024, // 2MB
		allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
		allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
	},
	document: {
		maxSize: 10 * 1024 * 1024, // 10MB
		allowedTypes: ['application/pdf', 'text/plain'],
		allowedExtensions: ['.pdf', '.txt']
	}
} as const;

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
	sanitizedFilename?: string;
}

export function validateFile(
	file: File,
	config: FileValidationConfig
): FileValidationResult {
	// Check file size
	if (file.size > config.maxSize) {
		return {
			isValid: false,
			error: `File size exceeds ${formatFileSize(config.maxSize)} limit`
		};
	}

	// Check file type
	if (!config.allowedTypes.includes(file.type)) {
		return {
			isValid: false,
			error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`
		};
	}

	// Check file extension
	const extension = getFileExtension(file.name);
	if (!config.allowedExtensions.includes(extension)) {
		return {
			isValid: false,
			error: `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`
		};
	}

	// Validate filename
	const sanitizedFilename = sanitizeFilename(file.name);
	if (!sanitizedFilename) {
		return {
			isValid: false,
			error: "Invalid filename"
		};
	}

	return {
		isValid: true,
		sanitizedFilename
	};
}

export function sanitizeFilename(filename: string): string {
	// Remove path traversal attempts and dangerous characters
	return filename
		.replace(/[\/\\\.\.\:*?"<>|]/g, '') // Remove dangerous chars
		.replace(/^\.+/, '') // Remove leading dots
		.slice(0, 255) // Limit length
		.trim();
}

export function getFileExtension(filename: string): string {
	const lastDotIndex = filename.lastIndexOf('.');
	return lastDotIndex !== -1 ? filename.slice(lastDotIndex).toLowerCase() : '';
}

export function formatFileSize(bytes: number): string {
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	if (bytes === 0) return '0 Bytes';
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Additional security: Check for malicious content patterns
export function scanFileContent(fileBuffer: ArrayBuffer): boolean {
	// Convert to string for pattern matching
	const uint8Array = new Uint8Array(fileBuffer);
	const textContent = String.fromCharCode.apply(null, Array.from(uint8Array.slice(0, 1024))); // First 1KB

	// Check for suspicious patterns
	const maliciousPatterns = [
		/<script/i,
		/javascript:/i,
		/data:text\/html/i,
		/eval\(/i,
		/onload=/i,
		/onerror=/i
	];

	return !maliciousPatterns.some(pattern => pattern.test(textContent));
}

export async function validateUploadedFile(
	file: File,
	configType: keyof typeof fileValidationConfigs
): Promise<FileValidationResult> {
	const config = fileValidationConfigs[configType];

	// Basic validation
	const basicValidation = validateFile(file, config);
	if (!basicValidation.isValid) {
		return basicValidation;
	}

	// Content validation for security
	try {
		const fileBuffer = await file.arrayBuffer();
		const isContentSafe = scanFileContent(fileBuffer);

		if (!isContentSafe) {
			return {
				isValid: false,
				error: "File content appears to be malicious"
			};
		}
	} catch (error) {
		return {
			isValid: false,
			error: "Failed to validate file content"
		};
	}

	return basicValidation;
}