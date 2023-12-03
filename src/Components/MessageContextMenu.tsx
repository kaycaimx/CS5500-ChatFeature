import React, { useState } from 'react';
import './MessageContextMenu.css';
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
        <div className="message-context-menu">
            {editMode ? (
                <div className="edit-section">
                    <input type="text" value={editedMessage} onChange={(e) => setEditedMessage(e.target.value)} className="edit-input" />
                    <div className="button-container">
                        <button onClick={handleSave} className="save-button">Save</button>
                        <button onClick={handleCancel} className="cancel-button">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="action-buttons">
                    <div className="edit-button" onClick={handleEdit}>Edit</div>
                    <div className="delete-button" onClick={handleDelete}>Delete</div>
                </div>
            )}
        </div>
    );
};

export default MessageContextMenu;
