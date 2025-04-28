
import type { Member } from '@/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy } from 'lucide-react';

interface LeaderboardTableProps {
  members: Member[];
}

export function LeaderboardTable({ members }: LeaderboardTableProps) {
  const sortedMembers = [...members].sort((a, b) => b.points - a.points);

  return (
    <Table>
      <TableCaption>Leaderboard of Member Points</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="text-right">Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedMembers.map((member, index) => (
          <TableRow key={member.id}>
            <TableCell className="font-medium flex items-center gap-2">
              {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
              {index === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
              {index === 2 && <Trophy className="w-4 h-4 text-orange-600" />}
              {index + 1}
            </TableCell>
            <TableCell>{member.name}</TableCell>
            <TableCell className="text-right">{member.points}</TableCell>
          </TableRow>
        ))}
        {members.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground">
              No members yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
