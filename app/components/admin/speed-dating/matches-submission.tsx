"use client";

import { useState } from "react";
import { Input } from "@/app/components/input";
import { Button } from "@/app/components/button";
import MatchesTable from "./matches-table";
import { DatingMatch } from "@/app/lib/types";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function MatchesSubmission() {
	const [fromInput, setFromInput] = useState("");
	const [toInput, setToInput] = useState("");
	const [matches, setMatches] = useState<DatingMatch[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

	const validateIDs = (from: string, to: string): boolean => {
		if (!from || !to) {
			setErrorMessage("Both IDs must be provided.");
			return false;
		}
		if (isNaN(Number(from)) || isNaN(Number(to))) {
			setErrorMessage("Both IDs must be numeric.");
			return false;
		}
		setErrorMessage("");
		return true;
	};


	const handleAdd = async () => {

		if (!validateIDs(fromInput, toInput)) {
			return;
		}

		const payload = { from: fromInput, to: toInput };
		try {
			const res = await fetch("/api/speed-dating/add-match", {
				method: "POST",
				body: JSON.stringify(payload),
				headers: { "Content-Type": "application/json" },
			});
			const result = await res.json();
			if (!result.success) {
				setErrorMessage(result.error || "Failed to add match.");
				return;
			}
			const newMatch: DatingMatch = {
				from: result.from.id,
				to: result.to.id,
				fromName: result.from.name,
				toName: result.to.name,
				submitted: true,
			};
			setMatches((prev) => [newMatch, ...prev]);
			setFromInput("");
			setToInput("");
			setErrorMessage("");

		} catch (error) {
			console.error("Error calling get-names API:", error);
			setErrorMessage("An error occurred while processing your request.");
		}
	};

	return (
		<div className="p-6">
			<h1 className="text-3xl font-semibold mb-4">Add Match</h1>
			{/* Input Section */}
			<div className="flex flex-col">

				<div className="flex flex-row items-center justify-between space-x-2 mb-4">
					<div className="flex flex-row space-x-8 w-full">

						<Input
							placeholder="From ID"
							value={fromInput}
							onChange={(e) => setFromInput(e.target.value)}
							className="bg-transparent self-end truncate w-[80%] p-2 border border-gray-300"
						/>
						<Input
							placeholder="To ID"
							value={toInput}
							onChange={(e) => setToInput(e.target.value)}
							className="bg-transparent self-end truncate w-[80%] p-2 border border-gray-300"
						/>

					</div>
					<Button variant="outline" onClick={handleAdd}>
						<PlusIcon className="w-5 h-5" />
					</Button>
				</div>
				{errorMessage && (
					<div className="text-red-500 text-sm mb-4">
						{errorMessage}
					</div>
				)}
			</div>
			<h1 className="text-2xl md:text-4xl py-6">Existing Matches</h1>
			<MatchesTable matches={matches} />
		</div>
	);
}
