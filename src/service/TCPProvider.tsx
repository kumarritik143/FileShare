import 'react-native-get-random-values';
import {createContext, FC, useCallback, useContext, useState} from 'react';
import {useChunkStore} from '../db/chunkStore';
import TcpSocket from 'react-native-tcp-socket';
import DeviceInfo from 'react-native-device-info';
import {Alert, Platform} from 'react-native';

import RNFS from 'react-native-fs';
import {v4 as uuidv4} from 'uuid';
import {produce} from 'immer';
import {Buffer} from 'buffer';
import { receiveChunkAck, receiveFileAck, sendChunkAck } from './TCPUtils';
import { Socket } from 'dgram';

interface TCPContextType {
  server: any;
  client: any;
  isConnected: boolean;
  sentFiles: any;
  receivedFiles: any;
  totalSentBytes: number;
  connectedDevice: any;
  totalReceivedBytes: number;
  startServer: (port: number) => void;
  connectToServer: (host: string, port: number, deviceName: string) => void;
  sendMessage: (message: string | Buffer) => void;
  sendFileAck: (file: any, type: 'file' | 'image') => void;
  disconnect: () => void;
}

const TCPContex = createContext<TCPContextType | undefined>(undefined);

export const useTCP = (): TCPContextType => {
  const context = useContext(TCPContex);
  if (!context) {
    throw new Error('useTCP must be used within TCPProvider');
  }
  return context;
};

const options = {
  keystore: require('../../tls_certs/server-keystore.p12'),
};

export const TCPProvider: FC<{children: React.ReactNode}> = ({children}) => {
  const [server, setServer] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [serverSocket, setServerSocket] = useState<any>(null);
  const [sentFiles, setSentFiles] = useState<any>([]);
  const [receivedFiles, setReceivedFiles] = useState<any>([]);
  const [totalSentBytes, setTotalSentBytes] = useState<number>(0);
  const [totalReceivedBytes, setTotalReceivedBytes] = useState<number>(0);

  const {currentChunkSet, setCurrentChunkSet, setChunkStore} = useChunkStore();

  // Disconnect

  const disconnect = useCallback(() => {
    console.log('Disconnect called - cleaning up connections...');
    
    if (client) {
      console.log('Destroying client connection...');
      client.destroy();
      setClient(null);
    }
    
    if (serverSocket) {
      console.log('Destroying server socket...');
      serverSocket.destroy();
      setServerSocket(null);
    }
    
    if (server) {
      console.log('Closing server...');
      server.close();
      setServer(null);
    }
    
    // Reset all state
    setReceivedFiles([]);
    setSentFiles([]);
    setCurrentChunkSet(null);
    setTotalReceivedBytes(0);
    setTotalSentBytes(0);
    setChunkStore(null);
    setIsConnected(false);
    setConnectedDevice(null);
    
    console.log('Disconnect cleanup completed');
  }, [client, server, serverSocket]);

  // start Server
  const startServer = useCallback(
    (port: number) => {
      if (server) {
        console.log('Server already Running');
        return;
      }
      const newServer = TcpSocket.createTLSServer(options, socket => {
        console.log('Clent connected :', socket.address());
        setServerSocket(socket);
        socket.setNoDelay(true);
        socket.readableHighWaterMark = 1024 * 1024 * 1;
        socket.writableHighWaterMark = 1024 * 1024 * 1;
        console.log("Here")

        socket.on('data', async data => {
          const parsedData = JSON.parse(data?.toString());
          console.log('Server received data:', parsedData);
          
          if (parsedData?.event === 'connect') {
            console.log('Server: Client connected with device name:', parsedData?.deviceName);
            setIsConnected(true);
            setConnectedDevice(parsedData?.deviceName);
          }
          if (parsedData.event === 'file_ack') {
            receiveFileAck(parsedData?.file, socket, setReceivedFiles);
          }
                  if (parsedData.event === 'send_chunk_ack') {
          sendChunkAck(
            parsedData?.chunkNo,
            socket,
            setTotalSentBytes,
            setSentFiles,
          );
        }
          if (parsedData.event === 'receive_chunk_ack') {
            receiveChunkAck(
              parsedData?.chunk,
              parsedData?.chunkNo,
              socket,
              setTotalReceivedBytes,
              generateFile,
            );
          }
        });

        socket.on('close', () => {
          console.log('Client Disconnected');
          setReceivedFiles([]);
          setSentFiles([]);
          setCurrentChunkSet(null);
          setTotalReceivedBytes(0);
          setTotalSentBytes(0);
          setChunkStore(null);
          setIsConnected(false);
          setConnectedDevice(null);
          setServerSocket(null);
        });
        socket.on('error', err => console.log('Socket', err));
      });

      newServer.listen({port, host: '0.0.0.0'}, () => {
        const address = newServer.address();
        console.log(
          `Server is running on ${address?.address}  : ${address?.port}`,
        );
      });

      newServer.on('error', err => console.log('Server Error', err));
      setServer(newServer);
    },
    [server],
  );

  // Start Client

  const connectToServer = useCallback(
    (host: string, port: number, deviceName: string) => {
      const newClient = TcpSocket.connectTLS(
        {
          host,
          port,
          cert: true,
          ca: require('../../tls_certs/server-cert.pem'),
        },
        async () => {
          console.log('Client: Connected to server, setting connectedDevice to:', deviceName);
          setIsConnected(true);
          setConnectedDevice(deviceName);
          
          // Try to get device name with fallback
          let myDeviceName = 'Unknown Device';
          try {
            myDeviceName = await DeviceInfo.getDeviceName();
            if (!myDeviceName || myDeviceName === 'unknown') {
              myDeviceName = await DeviceInfo.getModel();
            }
            if (!myDeviceName || myDeviceName === 'unknown') {
              myDeviceName = 'Unknown Device';
            }
          } catch (error) {
            console.log('Error getting device name:', error);
            myDeviceName = 'Unknown Device';
          }
          
          console.log('Client: Sending connect event with device name:', myDeviceName);
          newClient.write(
            JSON.stringify({event: 'connect', deviceName: myDeviceName}),
          );
        },
      );
      newClient.setNoDelay(true);
      newClient.readableHighWaterMark = 1024 * 1024 * 1;
      newClient.writableHighWaterMark = 1024 * 1024 * 1;

      newClient.on('data', async data => {
        const parsedData = JSON.parse(data?.toString());

        if (parsedData.event === 'file_ack') {
          receiveFileAck(parsedData?.file, newClient, setReceivedFiles);
        }
        if (parsedData.event === 'send_chunk_ack') {
          sendChunkAck(
            parsedData?.chunkNo,
            newClient,
            setTotalSentBytes,
            setSentFiles,
          );
        }
        if (parsedData.event === 'receive_chunk_ack') {
          receiveChunkAck(
            parsedData?.chunk,
            parsedData?.chunkNo,
            newClient,
            setTotalReceivedBytes,
            generateFile,
          );
        }
      });

      newClient.on('close', () => {
        console.log('Connection Closed');
        setReceivedFiles([]);
        setSentFiles([]);
        setCurrentChunkSet(null);
        setTotalReceivedBytes(0);
        setTotalSentBytes(0);
        setChunkStore(null);
        setIsConnected(false);
        setConnectedDevice(null);
        setClient(null);
      });
      newClient.on('error', err => {
        console.log('Error in Client', err);
      });
      setClient(newClient);
    },
    [],
  );

  //   Generate File
  const generateFile = async () => {
    const {chunkStore, resetChunkStore} = useChunkStore.getState();

    if (!chunkStore) {
      console.log('no chunks or files to process');
      return;
    }
    const receivedChunks = chunkStore?.chunkArray?.filter(chunk => chunk !== null).length;
    console.log(`generateFile: totalChunk=${chunkStore?.totalChunk}, chunkArray.length=${chunkStore.chunkArray.length}, receivedChunks=${receivedChunks}`);
    if (receivedChunks < chunkStore?.totalChunk) {
      console.log('Not all chunks have been received');
      return;
    }
    try {
      const combinedChunks = Buffer.concat(chunkStore.chunkArray);

      const platformPath =
        Platform.OS == 'ios'
          ? `${RNFS.DocumentDirectoryPath}`
          : `${RNFS.DownloadDirectoryPath}`;
      const filePath = `${platformPath}/${chunkStore.name}`;
      await RNFS.writeFile(filePath,combinedChunks?.toString('base64'),'base64');

      console.log('Current received files before update:', receivedFiles);
      setReceivedFiles((prevFiles:any)=>
        produce(prevFiles,(draftFiles:any)=>{
            const fileIndex= draftFiles?.findIndex((f:any)=>f.id===chunkStore.id)
            console.log(`Updating received file at index ${fileIndex}, file id: ${chunkStore.id}`);
            console.log('All file IDs in received files:', draftFiles?.map((f: any) => f.id));
            if(fileIndex!==-1){
                draftFiles[fileIndex]={
                    ...draftFiles[fileIndex],
                    uri:filePath,
                    available:true
                };
                console.log('File updated successfully in received files');
            } else {
                console.log('File not found in received files list');
            }
        }),
    );

    console.log("File saved Successfully✅",filePath)
    resetChunkStore()



    } catch (error) {
      console.log('Erro in combing chunks or saving file', error);
    }
  };

  // send message
  const sendMessage= useCallback((message:string|Buffer)=>{

    if(client){
      client.write(JSON.stringify(message))
      console.log("MEssage sent from client",message);
    }
    else if(server){
      serverSocket.write(JSON.stringify(message));
      console.log("Message sent from server",message);
    }
    else{
      console.log("No Client or server socket available")
    }

  },[client,server])


  //  Send fileAck

  const sendFileAck= async(file:any,type:'image'|'file')=>{
      if(currentChunkSet!=null){
        Alert.alert("Wait for current File to be sent")
        return
      }

      const normalizedPath= Platform.OS==='ios'?file?.uri?.replace('file://',""):file?.uri;
      const fielData= await RNFS.readFile(normalizedPath,'base64');
      const buffer=Buffer.from(fielData,'base64');
      const CHUNK_SIZE= 1024*8;

      let totalChunk=0;
      let offset=0;
      let chunkArray=[];
      while(offset<buffer.length){
        const chunk= buffer.slice(offset,offset+CHUNK_SIZE)
        totalChunk += 1;
        chunkArray.push(chunk);
        offset+= chunk.length;
      } 
      const rowData={
        id:uuidv4(),
        name:type==='file'?file?.name:file?.fileName,
        size:type==='file'?file?.size: file?.fileSize,
        mimType:type=='file'?file?.type?.split('/')[1] || 'file':'jpg',
        totalChunk
      };
      setCurrentChunkSet({
        id:rowData?.id,
        chunkArray,
        totalChunks: totalChunk
      })
      setSentFiles((prevData:any)=>
      produce(prevData,(draft:any)=>{
        draft.push({...rowData,
          uri:file?.uri
        })
      }))
      const socket= client || serverSocket;
      if(!socket){
        return;
      }

      try {
        console.log("File Acknowledge done");
        socket.write(JSON.stringify({event:'file_ack',file:rowData}))
        
      } catch (error) {
        console.log("Error in sending file", error);
        
      }

  }

  return (
    <TCPContex.Provider
      value={{
        server,
        client,
        connectedDevice,
        sentFiles,
        receivedFiles,
        totalReceivedBytes,
        totalSentBytes,
        isConnected,
        startServer,
        connectToServer,
        disconnect,
        sendMessage,
        sendFileAck,
      }}>
      {children}
    </TCPContex.Provider>
  );
};
