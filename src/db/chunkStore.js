import { create } from "zustand";
import { Buffer } from "buffer";

export const useChunkStore=create((set)=>({
    chunkStore:null,
    currentChunkSet:null,
    setChunkStore:chunkStore=>set(()=>({chunkStore})),
    resetChunkStore:()=>set(()=>({chunkStore:null})),
    setCurrentChunkSet:currentChunkSet=>set(()=>({currentChunkSet})),
    resetCurrentChunkSet:()=>set(()=>({currentChunkSet:null}))
}))