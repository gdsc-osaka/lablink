"use client"

import { useState, useEffect } from "react";
import { groupService } from "@/di";
import { Group } from "@/domain/group"; 
import { User } from "@/domain/user";

// グループ一覧を取得するフック
export const useUserGroups = (userId: string | undefined) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      setLoading(true);
      const result = await groupService.getGroupsByUserId(userId);
      
      result.match(
        (data) => {
          setGroups(data);
          setError(null);
        },
        (err) => {
          console.error(err);
          setError("グループ一覧の取得に失敗しました");
        }
      );
      setLoading(false);
    };

    fetch();
  }, [userId]);

  return { groups, loading, error };
};

// 特定グループのメンバーを取得するフック
export const useGroupMembers = (groupId: string | undefined) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const result = await groupService.getGroupMembers(groupId);

      result.match(
        (data) => {
          setMembers(data);
        },
        (err) => {
          console.error(err);
        }
      );
      setLoading(false);
    };

    fetch();
  }, [groupId]);

  return { members, loading };
};