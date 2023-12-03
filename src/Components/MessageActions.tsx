import React, { useState, useRef } from 'react';

interface MessageActionsProps {
    messageId: string;
    originalMessage: string;
    onUpdate: (messageId: string, newMessage: string) => void;
    onDelete: (messageId: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({ messageId, originalMessage, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState(originalMessage);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleRightClick = (event: React.MouseEvent) => {
        event.preventDefault();
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleUpdate = () => {
        onUpdate(messageId, editedMessage);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedMessage(originalMessage);
        setIsEditing(false);
    };

    return (
        <div onContextMenu={handleRightClick}>
            {isEditing ? (
                <>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={editedMessage} 
                        onChange={(e) => setEditedMessage(e.target.value)} 
                    />
                    <button onClick={handleUpdate}>Confirm</button>
                    <button onClick={handleCancel}>Cancel</button>
                </>
            ) : (
                <div>{originalMessage}</div>
            )}
        </div>
    );
};

export default MessageActions;
