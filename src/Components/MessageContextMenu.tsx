import React, { useState } from 'react';

interface MessageContextMenuProps {
    messageId: number;
    originalMessage: string;
    onEdit: (messageId: number, newMessage: string) => void;
    onDelete: (messageId: number) => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({ messageId, originalMessage, onEdit, onDelete }) => {
    const [editMode, setEditMode] = useState(false);
    const [editedMessage, setEditedMessage] = useState(originalMessage);

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleDelete = () => {
        onDelete(messageId);
    };

    const handleSave = () => {
        onEdit(messageId, editedMessage);
        setEditMode(false);
    };

    const handleCancel = () => {
        setEditedMessage(originalMessage);
        setEditMode(false);
    };

    return (
        <div onContextMenu={(e) => e.preventDefault()}>
            {editMode ? (
                <>
                    <input type="text" value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} />
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                </>
            ) : (
                <>
                    <button onClick={handleEdit}>Edit</button>
                    <button onClick={handleDelete}>Delete</button>
                </>
            )}
        </div>
    );
};

export default MessageContextMenu;
