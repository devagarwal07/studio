
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
import { Trophy, Medal, Award } from 'lucide-react'; // Use different icons maybe
import { motion } from 'framer-motion'; // Import framer-motion

interface LeaderboardTableProps {
  members: Member[];
}

const rowVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.05, // Stagger animation
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-lg" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400 drop-shadow-md" />; // Changed icon
    if (index === 2) return <Award className="w-5 h-5 text-orange-600 drop-shadow-sm" />; // Changed icon
    return <span className="w-5 h-5 inline-block"></span>; // Placeholder for alignment
};

export function LeaderboardTable({ members }: LeaderboardTableProps) {
  // Ensure members is always an array even if undefined/null is passed
  const sortedMembers = [...(members || [])].sort((a, b) => b.points - a.points);

  return (
    <div className="overflow-hidden rounded-lg border shadow-inner bg-card/50" style={{ perspective: '1200px' }}>
        <Table>
        <TableCaption className="py-4 text-base">Leaderboard of Member Points</TableCaption>
        <TableHeader>
            {/* Apply subtle 3D rotation on hover to the header */}
            <TableRow className="hover:bg-muted/70 transition-colors duration-200">
            <TableHead className="w-[100px] text-center font-semibold text-lg text-primary">Rank</TableHead>
            <TableHead className="font-semibold text-lg text-primary">Name</TableHead>
            <TableHead className="text-right font-semibold text-lg text-primary pr-6">Points</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {sortedMembers.map((member, index) => (
            <motion.tr // Use motion.tr for animation
                key={member.id}
                className="border-b border-border/50 hover:bg-muted/60 transition-all duration-200 hover:shadow-md"
                 style={{ transformOrigin: 'center center' }} // Ensure rotation happens correctly
                 whileHover={{ scale: 1.01, z: 5, rotateX: -2 }} // Subtle lift and tilt on hover
                 variants={rowVariants}
                 initial="hidden"
                 animate="visible"
                 custom={index} // Pass index for staggering
            >
                <TableCell className="font-medium text-center text-lg flex items-center justify-center gap-2 py-4">
                {getRankIcon(index)}
                <span className={`font-bold ${index < 3 ? 'text-xl' : 'text-lg'}`}>{index + 1}</span>
                </TableCell>
                <TableCell className="text-lg py-4">{member.name}</TableCell>
                <TableCell className="text-right text-lg font-semibold text-primary pr-6 py-4">{member.points}</TableCell>
            </motion.tr>
            ))}
            {sortedMembers.length === 0 && (
            <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-lg">
                 The leaderboard is empty... Be the first! 🏆
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}

// Note: For framer-motion animations to work, ensure it's installed (`npm install framer-motion`)
// and that the parent component allows client-side rendering ('use client').
// The dashboard pages are already 'use client', so this should work.
