import React, { useEffect, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";

interface Option {
    id: string;
    name: string;
}

const CharacterCreate: React.FC = () => {
    const [speciesOptions, setSpeciesOptions] = useState<Option[]>([]);
    const [skillsOptions, setSkillsOptions] = useState<Option[]>([]);
    const [selectedSpecies, setSelectedSpecies] = useState("");
    const [selectedSkill, setSelectedSkill] = useState("");

    useEffect(() => {
        // Fetch character species
        fetch("/api/dbService/characterSpecies")
            .then((res) => res.json())
            .then((data) => setSpeciesOptions(data))
            .catch(console.error);

        // Fetch character skills
        fetch("/api/dbService/characterSkills")
            .then((res) => res.json())
            .then((data) => setSkillsOptions(data))
            .catch(console.error);
    }, []);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Handle character creation logic here
        console.log("Selected Species:", selectedSpecies);
        console.log("Selected Skill Distribution:", selectedSkill);
    };

    return (
        <div className="max-w-md mx-auto p-4">
            <h1 className="text-xl font-bold mb-4">Create Your Character</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select Character Species */}
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="species">
                        Character Species
                    </label>
                    <Select.Root value={selectedSpecies} onValueChange={setSelectedSpecies}>
                        <Select.Trigger
                            id="species"
                            className="flex items-center justify-between w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <Select.Value placeholder="Select Species" />
                            <Select.Icon>
                                <ChevronDownIcon />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="bg-white border rounded shadow-lg">
                                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-100 cursor-default">
                                    ▲
                                </Select.ScrollUpButton>
                                <Select.Viewport className="p-2">
                                    {speciesOptions.map((option) => (
                                        <Select.Item
                                            key={option.id}
                                            value={option.id}
                                            className="relative flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-blue-100"
                                        >
                                            <Select.ItemText>{option.name}</Select.ItemText>
                                            <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                                                <CheckIcon />
                                            </Select.ItemIndicator>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-100 cursor-default">
                                    ▼
                                </Select.ScrollDownButton>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </div>

                {/* Select Skill Distribution */}
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="skill">
                        Skill Distribution
                    </label>
                    <Select.Root value={selectedSkill} onValueChange={setSelectedSkill}>
                        <Select.Trigger
                            id="skill"
                            className="flex items-center justify-between w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <Select.Value placeholder="Select Skill Distribution" />
                            <Select.Icon>
                                <ChevronDownIcon />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content className="bg-white border rounded shadow-lg">
                                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-100 cursor-default">
                                    ▲
                                </Select.ScrollUpButton>
                                <Select.Viewport className="p-2">
                                    {skillsOptions.map((option) => (
                                        <Select.Item
                                            key={option.id}
                                            value={option.id}
                                            className="relative flex items-center px-3 py-1.5 rounded cursor-pointer hover:bg-blue-100"
                                        >
                                            <Select.ItemText>{option.name}</Select.ItemText>
                                            <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
                                                <CheckIcon />
                                            </Select.ItemIndicator>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-100 cursor-default">
                                    ▼
                                </Select.ScrollDownButton>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring"
                >
                    Create Character
                </button>
            </form>
        </div>
    );
};

export default CharacterCreate;