

import { produce, Producer } from "immer";
import { Alert } from "react-native";
import { useChunkStore } from "../db/chunkStore";
import { Buffer } from "buffer";
import { resolve } from "path";


export const receiveFileAck= async(
    data:any,
    socket:any, 
    setReceivedFiles:any
)=>{
    const {setChunkStore,chunkStore} =useChunkStore.getState()
    if(chunkStore){
        Alert.alert("There are file which need to be received ")
        return;
    }
    console.log('Adding file to received files:', data);
    setReceivedFiles((prevData:any)=>
    produce(prevData,(draft:any)=>{
        draft.push(data);
        console.log('File added to received files. Total received files:', draft.length);
    })
    );

    console.log('Setting up chunk store with totalChunk:', data?.totalChunk);
    setChunkStore({
        id:data?.id,
        totalChunk:data?.totalChunk,
        name:data?.name,
        size:data?.size,
        mimType:data?.mimType,
        chunkArray:new Array(data?.totalChunk).fill(null)
    })

    if(!socket){
        console.log("Socket no availabel")
        return;
    }
    try {
        await new Promise((resolve)=>setTimeout(resolve,10))
        console.log("FileReceived in tcp utils line no 41")
        socket.write(JSON.stringify({event:'send_chunk_ack',chunkNo:0}));
        console.log("Requested for first chunk")
        
    } catch (error) {
        console.log("Error in sending files",error)
        
    }

};


export const sendChunkAck= async(
    chunkIndex:any,
    socket:any,
    setTotalSentBytes:any,
    setSentFiles:any,
)=>{
    const {currentChunkSet,resetCurrentChunkSet} =useChunkStore.getState()
    if(!currentChunkSet){
        Alert.alert("There are file which need to be received ")
        return;
    }
    if(!socket){
        console.log("Socket are not available");
        return;
    }
    const totalChunk= currentChunkSet?.totalChunks;
    try {
        await new Promise((resolve)=>setTimeout(resolve,10));
        socket.write(
           
                JSON.stringify({
                    event:'receive_chunk_ack',
                    chunk:currentChunkSet?.chunkArray[chunkIndex].toString('base64'),

                    chunkNo:chunkIndex
                
                })
           
        )
        setTotalSentBytes((prev:number)=>prev+currentChunkSet.chunkArray[chunkIndex]?.length);

        if(chunkIndex+2>totalChunk){
            console.log("All chunks sent successfully✅");
            setSentFiles((prevFile:any)=>
            produce(prevFile,(draftFiles:any)=>{
                const fileIndex= draftFiles?.findIndex((f:any)=>f.id===currentChunkSet.id)
                if(fileIndex!==-1){
                    draftFiles[fileIndex].available=true
                }
            }))
            resetCurrentChunkSet()
        }
        
    } catch (error) {
        
    }
}
export const receiveChunkAck= async(
    chunk:any,
    chunkNo:any,
    socket:any,
    setTotalReceivedBytes:any,
    generateFile:any
)=>{

    const {chunkStore,resetChunkStore,setChunkStore}= useChunkStore.getState();
    if(!chunkStore){
        console.log("ChunkStore is null");
        return;
    }
    
    console.log(`Processing chunk ${chunkNo}, current chunkStore:`, chunkStore);
    try {
        const bufferChunk=Buffer.from(chunk,'base64');
        
        const updatedChunkArray= [...(chunkStore?.chunkArray|| [])]
        updatedChunkArray[chunkNo]=bufferChunk;
        
        console.log(`Updating chunk ${chunkNo}, chunkStore before update:`, chunkStore);
        
        // Update the chunk store with the new array
        const updatedChunkStore = {
            ...chunkStore,
            chunkArray: updatedChunkArray
        };
        
        setChunkStore(updatedChunkStore);
        setTotalReceivedBytes((prevValue:number)=>prevValue+bufferChunk.length);
        
        // Check if we have received all chunks
        const receivedChunks = updatedChunkArray.filter(chunk => chunk !== null).length;
        console.log(`Received ${receivedChunks} out of ${updatedChunkStore.totalChunk} chunks`);
        
        if(receivedChunks >= updatedChunkStore.totalChunk){
            console.log('All chunks Received ✅')
            generateFile();
            resetChunkStore();
            return;
        }
        
    } catch (error) {
        console.log("ERROR in rECEIVING chunk",error)
    }
    
    if(!socket){
        console.log("Socket not available");
        return;
    }
    
    try {
        await new Promise((resolve)=>setTimeout(resolve,10));
        console.log("Requested for next chunk🎙️",chunkNo+1)
        socket.write(JSON.stringify({event:'send_chunk_ack',chunkNo:chunkNo+1}))
        
    } catch (error) {
        console.log("Error sending chunk",error)
        
    }
 
}




