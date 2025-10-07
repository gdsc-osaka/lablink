import GroupView, {
    Member,
    Group,
} from "./group_homepages_components/group_view";
const mockMemberList: Member[] = [
    {
        id: "abc",
        name: "aaa",
        iconUrl: "",
    },
    {
        id: "def",
        name: "bbb",
    },
    {
        id: "ghi",
        name: "ccc",
    },
];

const mockGroupList: Group[] = [
    {
        name: "haraken",
        members: mockMemberList,
    },
    {
        name: "gggken",
        members: mockMemberList,
    },
];

export default function Home() {
    return (
        <div style={{ height: "100%" }}>
            <main style={{ height: "100%" }}>
                <GroupView group={mockGroupList[0]}></GroupView>
            </main>
        </div>
    );
}
