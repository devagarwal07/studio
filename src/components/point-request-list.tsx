
"use client";

import type React from 'react';
import { useState } from 'react';
import type { PointRequest } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Hourglass, Loader2 } from 'lucide-react'; // Added Loader2
import { motion } from 'framer-motion'; // Import framer-motion

interface PointRequestListProps {
  requests: PointRequest[];
  showActions?: boolean; // Control visibility of approve/reject buttons
  // Use callbacks handled by the parent component (AdminDashboard) which has access to services
  onUpdateRequest?: (requestId: string, status: 'approved' | 'rejected') => Promise<void> | void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export function PointRequestList({ requests = [], showActions = false, onUpdateRequest }: PointRequestListProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (request: PointRequest) => {
        if (!request.points || request.points <= 0) {
             // Maybe show a toast here, but primary validation should be in the parent handler
             console.error("Cannot approve request without valid points value.");
             return;
        }
        if (!onUpdateRequest) return; // Guard if no handler provided

        setProcessingId(request.id);
        try {
             await onUpdateRequest(request.id, 'approved');
             // Toast/confirmation is handled in the parent (AdminDashboard) after successful service call
        } catch (error) {
             // Error toast handled in the parent
             console.error("Error during approval callback:", error);
        } finally {
             setProcessingId(null);
        }
    };

     const handleReject = async (requestId: string) => {
         if (!onUpdateRequest) return; // Guard if no handler provided

        setProcessingId(requestId);
         try {
            await onUpdateRequest(requestId, 'rejected');
             // Toast handled in parent
        } catch (error) {
             // Error toast handled in the parent
             console.error("Error during rejection callback:", error);
        } finally {
             setProcessingId(null);
        }
    };

    const sortedRequests = [...requests].sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());


  if (sortedRequests.length === 0) {
    return <p className="text-muted-foreground text-center py-4 italic">No point requests here.</p>;
  }

  return (
    <div className="space-y-4">
      {sortedRequests.map((request, index) => (
        <motion.div
           key={request.id}
           variants={cardVariants}
           initial="hidden"
           animate="visible"
           custom={index} // Stagger animation based on index
           whileHover={{ scale: 1.02 }} // Slight grow on hover
         >
         <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
           <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                  <CardTitle className="text-lg font-medium">{request.memberName}</CardTitle>
                  <CardDescription className="text-xs">
                      Requested {formatDistanceToNow(request.requestedAt, { addSuffix: true })} for {request.points ?? '?'} points
                  </CardDescription>
             </div>
              <Badge
                 variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}
                 className="capitalize flex items-center gap-1 text-xs py-1 px-2"
               >
                 {request.status === 'pending' && <Hourglass className="w-3 h-3" />}
                 {request.status === 'approved' && <Check className="w-3 h-3" />}
                 {request.status === 'rejected' && <X className="w-3 h-3" />}
                 {request.status}
             </Badge>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-foreground/90">{request.description}</p>
           </CardContent>
           {showActions && request.status === 'pending' && (
             <CardFooter className="flex justify-end space-x-2 bg-muted/30 py-3 px-6">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handleReject(request.id)}
                 disabled={processingId === request.id}
                 className="transition-transform duration-150 hover:scale-105 active:scale-95"
               >
                  {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4" />}
                  {processingId !== request.id && 'Reject'}
               </Button>
               <Button
                 size="sm"
                 onClick={() => handleApprove(request)}
                 disabled={processingId === request.id || !request.points || request.points <= 0}
                 title={!request.points || request.points <= 0 ? "Cannot approve without valid points value" : ""}
                 className="transition-transform duration-150 hover:scale-105 active:scale-95"
                >
                  {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                  {processingId !== request.id && 'Approve'}
               </Button>
             </CardFooter>
           )}
         </Card>
        </motion.div>
      ))}
    </div>
  );
}
