import React from 'react';
import { PortsGlobal, LOCAL_SERVER_URL, RENDER_SERVER_URL } from '../ServerDataDefinitions';

// define the props for ServerSelector

interface ServerSelectorProps {
    serverSelector: (buttonName: string) => void;
    serverSelected: string;
}


function ServerSelector({ serverSelector, serverSelected }: ServerSelectorProps) {


    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        return null;
    }


    //
    // the callback that will take the name of the button and called serverSelector
    // function onButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    //     const buttonName = event.currentTarget.innerText;
    //     serverSelector(buttonName);
    // }

    function onButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
        const buttonName = event.currentTarget.innerText;
        let serverUrl = '';
    
        if (buttonName === 'localhost') {
            serverUrl = `${LOCAL_SERVER_URL}:${PortsGlobal.serverPort}`;
        } else if (buttonName === 'renderhost') {
            serverUrl = RENDER_SERVER_URL;
        }
    
        if (serverUrl) {
            serverSelector(serverUrl);
        } else {
            console.error('Server URL is undefined');
        }
    }
    


    return (
        <div>
            <button onClick={onButtonClick}>localhost</button>
            <button onClick={onButtonClick}>renderhost</button>
            current server: {serverSelected}
        </div>
    )
}

export default ServerSelector;