import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const GroupInvitationScreen: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-white">
            <Card className="w-[500px] bg-gray-200">
                <CardHeader className="items-center justify-center text-center">
                    <CardTitle className="text-2xl font-normal text-gray-800">
                        「原研究室」 に招待されています
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between gap-12">
                        <Button variant="outline" size="lg" className="flex-1">
                            拒否する
                        </Button>
                        <Button variant="default" size="lg" className="flex-1">
                            参加する
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default GroupInvitationScreen;
