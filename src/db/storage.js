import {MMKV} from 'react-native-mmkv'

export const storage= new MMKV({
    id: 'my-app-storage',
    encryptionKey:'some-secret-key'
})

export const mmkvStorage={
    setItem:(key, value)=>{
        storage.set(key,value)
    },
    getItem:(key)=>{
        const value= storage.getString(key);
        return value??null
    },
    removeItem:(key)=>{
        storage.delete(key)
    }
}