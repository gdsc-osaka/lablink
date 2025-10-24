"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreateGroupPage = () => {
    const [groupName, setGroupName] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        console.log("グループが作成されました:", { groupName });
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-md border-2 bg-slate-200 px-10 py-12 text-center shadow-lg"
            >
                <h1 className="mb-2 text-xl font-semibold text-slate-900">
                    {"グループを作成する"}
                </h1>
                <p className="mb-3 text-sm text-slate-600">
                    {"グループ名"}
                </p>
                <Input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="グループ名を入力"
                    className="mb-6 h-10 border border-slate-300 bg-white text-base shadow-inner focus-visible:ring-blue-500"
                    required
                />
                <Button
                    type="submit"
                    className="btn-primary"
                    onClick= {() => {handleSubmit}}
                >
                作成
                </Button>
            </form>
        </main>
    );
};

export default CreateGroupPage;
