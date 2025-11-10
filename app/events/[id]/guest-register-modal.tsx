'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/button';
import { Input } from '../../components/input';
import toast from 'react-hot-toast';
import { Event } from '@/app/lib/types';
import { LondonUniversities } from '@/app/lib/utils';

interface GuestRegisterFormData {
  name: string;
  email: string;
  university: string;
  otherUniversity: string;
}

interface GuestRegisterModalProps {
  event: Event;
  onClose: () => void;
}

export default function GuestRegisterModal({ event, onClose }: GuestRegisterModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<GuestRegisterFormData>({
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      email: '',
      university: '',
      otherUniversity: '',
    },
  });

  // ✅ Watch the selected university and update dynamically
  const selectedUniversity = watch('university');

  useEffect(() => {
    setIsOtherSelected(selectedUniversity === 'Other (please specify)');
  }, [selectedUniversity]);

  const onSubmit = async (data: GuestRegisterFormData) => {
    const toastId = toast.loading('Registering you for the event...');
    setIsPending(true);

    try {
      // Step 1: Create user
      const userResponse = await fetch('/api/guest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          university: data.university,
          otherUniversity: data.otherUniversity,
        }),
      });

      if (!userResponse.ok) {
        toast.error('Failed to create user record.', { id: toastId });
        return;
      }

      const userResult = await userResponse.json();
      if (!userResult.success) {
        toast.error('Error creating user account.', { id: toastId });
        return;
      }

      // Step 2: Register for event
      const user_information = {
        name: data.name,
        email: data.email,
        id: userResult.id
      };

      const eventResponse = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          user_information,
        }),
      });

      const eventResult = await eventResponse.json();

      if (eventResult.success) {
        toast.success('Successfully registered for event!', { id: toastId });
        reset();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onClose();
      } else if (eventResult.registered) {
        toast.error('Already registered for this event!', { id: toastId });
      } else {
        toast.error('Error registering for the event!', { id: toastId });
      }
    } catch (error) {
      toast.error(`Error during event registration: ${error}`, { id: toastId });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-gray-900">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">
          Guest Event Registration
        </h2>

        <div className="text-center mb-4">
          <span className="block text-xs font-medium text-gray-700">
            Since you have not logged in, please provide your information to register for the event.
            If mistaken, please{' '}
            <a
              href="/login"
              className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-colors"
            >
              Log In
            </a>
            .
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-gray-900">
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              className="bg-white text-gray-900 border border-gray-300"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-900">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              className="bg-white text-gray-900 border border-gray-300"
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* University Dropdown */}
          <div>
            <h2 className="text-sm mb-2 font-medium">Where are you studying?</h2>
            <select
              className="w-full mt-1 p-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
              {...register('university', { required: 'University is required.' })}
            >
              <option value="">Select Institution</option>
              {LondonUniversities.map((university) => (
                <option key={university} value={university}>
                  {university}
                </option>
              ))}
            </select>
            {errors.university && (
              <p className="text-xs text-red-500 mt-1">{errors.university.message}</p>
            )}
          </div>

          {/* ✅ Conditional Input for Other University */}
          {isOtherSelected && (
            <div>
              <Input
                type="text"
                placeholder="Enter your university"
                className="w-full mt-2 bg-white text-gray-900 border border-gray-300 p-3"
                {...register('otherUniversity', { required: 'Other university is required.' })}
              />
              {errors.otherUniversity && (
                <p className="text-xs text-red-500 mt-1">{errors.otherUniversity.message}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="filled"
            size="md"
            className="mt-4 w-full"
            aria-disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Submit'}
            <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
        </form>
      </div>
    </div>
  );
}
