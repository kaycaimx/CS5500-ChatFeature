// define a interface for the message container 

// {messages:string[],
// paginationToken:string}

export interface MessageContainer {
    user: string,
    message: string,
    timestamp: Date,
    id: number
}

export interface MessagesContainer {
    messages: MessageContainer[],
    paginationToken: string
}

export const serverPort = 5800;