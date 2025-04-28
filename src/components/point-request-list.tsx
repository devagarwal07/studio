
"use client";

import type React from 'react';
import { useState } from 'react';
import type { PointRequest } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Hourglass } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

// Mock functions for approval/rejection
async function approveRequest(requestId: string): Promise<boolean> {
  console.log(`Approving request ${requestId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true; // Simulate success
}

async function rejectRequest(requestId: string): Promise<boolean> {
  console.log(`Rejecting request ${requestId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true; // Simulate success
}


interface PointRequestListProps {
  requests: PointRequest[];
  showActions?: boolean; // Control visibility of approve/reject buttons
  onUpdateRequest?: (requestId: string, status: 'approved' | 'rejected') => void; // Callback after action
}

export function PointRequestList({ requests, showActions = false, onUpdateRequest }: PointRequestListProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleApprove = async (request: PointRequest) => {
        if (!request.points) {
             toast({ title: "Error", description: "Cannot approve request without points value.", variant: "destructive" });
             return;
        }
        setProcessingId(request.id);
        try {
            const success = await approveRequest(request.id);
            if (success) {
                toast({ title: "Request Approved", description: `${request.points} points awarded to ${request.memberName}.` });
                onUpdateRequest?.(request.id, 'approved');
            } else {
                 throw new Error("Approval failed");
            }
        } catch (error) {
             toast({ title: "Error", description: "Failed to approve request.", variant: "destructive" });
        } finally {
             setProcessingId(null);
        }
    };

     const handleReject = async (requestId: string) => {
        setProcessingId(requestId);
         try {
            const success = await rejectRequest(requestId);
             if (success) {
                toast({ title: "Request Rejected" });
                onUpdateRequest?.(requestId, 'rejected');
            } else {
                 throw new Error("Rejection failed");
            }
        } catch (error) {
             toast({ title: "Error", description: "Failed to reject request.", variant: "destructive" });
        } finally {
             setProcessingId(null);
        }
    };


  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No point requests found.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
             <div>
                 <CardTitle className="text-lg">{request.memberName}</CardTitle>
                 <CardDescription>
                     Requested {formatDistanceToNow(request.requestedAt, { addSuffix: true })} for {request.points ?? '?'} points
                 </CardDescription>
            </div>
             <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize flex items-center gap-1">
                {request.status === 'pending' && <Hourglass className="w-3 h-3" />}
                {request.status === 'approved' && <Check className="w-3 h-3" />}
                {request.status === 'rejected' && <X className="w-3 h-3" />}
                {request.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{request.description}</p>
          </CardContent>
          {showActions && request.status === 'pending' && (
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
              >
                <X className="mr-1 h-4 w-4" /> {processingId === request.id ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(request)}
                disabled={processingId === request.id || !request.points}
                title={!request.points ? "Cannot approve without points value" : ""}
               >
                <Check className="mr-1 h-4 w-4" /> {processingId === request.id ? 'Approving...' : 'Approve'}
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
