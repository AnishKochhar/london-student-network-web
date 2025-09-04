import { ThreadData, ThreadUpdateData } from '@/app/lib/types';
import ContentItem from './content-item';

interface ThreadContentProps {
  thread: ThreadData;
  onVoteChange?: (threadId: number, upvotes: number, downvotes: number, userVote: string | null) => void;
  onThreadUpdate?: (threadId: number, updatedData: ThreadUpdateData) => void;
  onThreadDelete?: (threadId: number) => void; 
}

export default function ThreadContent({ thread, onVoteChange, onThreadUpdate, onThreadDelete }: ThreadContentProps) {
  // Simple wrapper component that uses the ContentItem
  return (
    <ContentItem 
      item={thread}
      type="thread"
      onVoteChange={onVoteChange}
      onItemUpdate={onThreadUpdate}
      onItemDelete={onThreadDelete}
    />
  );
}