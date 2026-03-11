"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormValues = { groupName: string };

const CreateGroupClient = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({ defaultValues: { groupName: "" } });

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        toast.success("グループを作成しました", {
            description: data.groupName,
        });
        // TODO: グループ作成ロジックを実装
        reset();
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
                    <p className="text-sm text-red-600 mb-4">
                        {errors.groupName.message}
                    </p>
                )}
                <Button type="submit" className="btn-primary">
                    作成
                </Button>
            </form>
        </main>
    );
};

export default CreateGroupClient;
