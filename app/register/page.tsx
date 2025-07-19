'use client';

import { UserGroupIcon, UserIcon, BriefcaseIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Register() {
	return (
		<main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] p-10">
			<h1 className='text-2xl p-10 text-center y-8 sm:my-12 tracking-wide capitalize'>Would you like to register a <i>Student</i>, <i>Society</i>, or <i>Company</i> account?</h1>
			<div className='flex flex-col md:flex-row items-center justify-center w-[80%] h-fit'>
				<OptionButton name='student' />
				<OptionButton name='society' />
				<OptionButton name='company' />
				<OptionButton name='guest' />
			</div>
		</main>
	)
}


function OptionButton({ name }: { name: 'student' | 'society' | 'company' | 'guest' }) {
	return (
		<Link href={`/register/${name}`} className='flex flex-col border border-white/50 p-10 m-4 max-h-[400px] h-fit w-full rounded-md shadow-xl items-center justify-center transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-opacity-90 bg-white/20'>
			{name === 'society' && (
				<div className='flex flex-col items-center justify-center'>
					<UserGroupIcon width={150} height={150} className='[&>path]:stroke-[0.4] sm:w-[200px] sm:h-[200px]' />
					<h1 className='text-2xl w-full text-center p-10'>Society</h1>
				</div>
			)}
			{name === 'student' && (
				<div className='flex flex-col items-center justify-center'>
					{/* <UserIcon width={200} height={200} className='[&>path]:stroke-[0.4]' /> */}
					<UserIcon width={150} height={150} className='[&>path]:stroke-[0.4] sm:w-[200px] sm:h-[200px]' />
					<h1 className='text-2xl w-full text-center p-10'>Student</h1>
				</div>
			)}
			{name === 'company' && (
				<div className='flex flex-col items-center justify-center'>
					<BriefcaseIcon width={150} height={150} className='[&>path]:stroke-[0.4] sm:w-[200px] sm:h-[200px]' />
					<h1 className='text-2xl w-full text-center p-10'>Company</h1>
				</div>
			)}
			{name === 'guest' && (
				<div className='flex flex-col items-center justify-center'>
					<IdentificationIcon width={150} height={150} className='[&>path]:stroke-[0.4] sm:w-[200px] sm:h-[200px]' />
					<h1 className='text-2xl w-full text-center p-10'>Guest</h1>
				</div>
			)}

		</Link>
	)
}
