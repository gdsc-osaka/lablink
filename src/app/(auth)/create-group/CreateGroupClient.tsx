"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroupAction } from "./actions";

type FormValues = { groupName: string };

const CreateGroupClient = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ defaultValues: { groupName: "" } });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setError(null);
        const result = await createGroupAction(data.groupName);
        if (result.success) {
            router.push("/group");
        } else {
            setError(result.error.message);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full max-w-sm rounded-md border-2 bg-slate-200 px-10 py-12 text-center shadow-lg"
            >
                <h1 className="mb-2 text-xl font-semibold text-slate-900">
                    グループを作成する
                </h1>
                <Label className="mb-3 text-sm text-slate-600">
                    グループ名
                </Label>
                <Input
                    placeholder="グループ名を入力してください"
                    className="mb-6 h-10 border border-slate-300 bg-white text-base shadow-inner focus-visible:ring-blue-500"
                    {...register("groupName", {
                        required: "グループ名は必須です",
                    })}
                />
                {errors.groupName && (
                    <p className="mb-4 text-sm text-red-600">
                        {errors.groupName.message}
                    </p>
                )}
                {error && (
                    <p className="mb-4 text-sm text-red-600">{error}</p>
                )}
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50"
                >
                    {isSubmitting ? "作成中..." : "作成"}
                </Button>
            </form>
        </main>
    );
};

export default CreateGroupClient;
