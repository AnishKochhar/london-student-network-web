import { Reply, CommentUpdateData } from '@/app/lib/types';
import ContentItem from './content-item';

interface ReplyItemProps {
  reply: Reply;
  onViewReplies: () => void;
  onVoteChange?: (replyId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onReplyUpdate?: (replyId: number, updatedData: CommentUpdateData) => void;
  onReplyDelete?: (replyId: number) => void; 
}

export default function ReplyItem({ 
  reply, 
  onViewReplies, 
  onVoteChange, 
  onReplyUpdate, 
  onReplyDelete 
}: ReplyItemProps) {
  return (
    <ContentItem
      item={reply}
      type="reply"
      onViewReplies={onViewReplies}
      replyCount={reply.replyCount || 0}
      onVoteChange={onVoteChange}
      onItemUpdate={onReplyUpdate}
      onItemDelete={onReplyDelete}
    />
  );
}