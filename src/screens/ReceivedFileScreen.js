import { FlatList, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import RNFS from 'react-native-fs'
import Icon from '../components/global/Icon'
import LinearGradient from 'react-native-linear-gradient'
import { sendStyles } from '../styles/sendStyles'
import CustomText from '../components/global/CustomText'
import { ActivityIndicator } from 'react-native'
import { Colors } from '../utils/Constants'

import { connectionStyles } from '../styles/connectionStyles'
import { formatFileSize } from '../utils/libraryHelpers'
import ReactNativeBlobUtil from 'react-native-blob-util'
import { goBack } from '../utils/NavigationUtil'


const ReceivedFileScreen = () => {
  const [receivedFiles,setReceivedFiles]= useState([])

  const [isLoading,setIsLoading]=useState(true);

  const getFilesFromDirectory=async()=>{
    setIsLoading(true)
    const platformPath=Platform.OS==='android'?
    `${RNFS.DownloadDirectoryPath}/`:
    `${RNFS.DocumentDirectoryPath}/`

      try {
        const exists= await RNFS.exists(platformPath);
        if(!exists){
          setReceivedFiles([])
          setIsLoading(false);
          return;
        }
        const files= await RNFS.readDir(platformPath);

        const formattedFiles= files.map(file=>({
          id:file.name,
          name:file.name,
          size:file.size,
          uri:file.path,
          mimeType:file.name.split('.').pop() || 'unknown'
        }))
        setReceivedFiles(formattedFiles)

        
      } catch (error) {
        console.log("Error in fetching files",error);
        setReceivedFiles([]);
        
      }
      finally{
        setIsLoading(false);
      }
  };
  useEffect(()=>{
    getFilesFromDirectory();
  },[])

  const renderThumbnail =(mimType)=>{
    switch(mimType){
      case 'mp3':
        return <Icon name='musical-notes' size={16} color='blue' iconFamily='Ionicons'/>
      case 'mp4':
        return <Icon name='videocam' size={16} color='green' iconFamily='Ionicons'/>
      case 'jpg': 
         return <Icon name='image' size={16} color='orange' iconFamily='Ionicons'/>
      case 'pdf':
        return <Icon name='document' size={16} color='#d358c3' iconFamily='Ionicons'/>
      default:
        return <Icon name='folder' size={16} color='#ff00bf' iconFamily='Ionicons'/>

    }
  };
  const handleOpen = (item) => {
    console.log('Attempting to open file:', item);
    
    if (!item?.uri) {
      console.log('No file URI found');
      return;
    }

    // Get proper MIME type
    const getMimeType = (mimeType) => {
      switch (mimeType?.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'pdf':
          return 'application/pdf';
        case 'mp3':
          return 'audio/mpeg';
        case 'mp4':
          return 'video/mp4';
        case 'txt':
          return 'text/plain';
        default:
          return '*/*';
      }
    };

    const mimeType = getMimeType(item?.mimeType);
    console.log('File MIME type:', mimeType);

    if (Platform.OS === 'ios') {
      // For iOS, ensure the path is correct
      const filePath = item.uri.startsWith('file://') ? item.uri : `file://${item.uri}`;
      console.log('iOS file path:', filePath);
      
      ReactNativeBlobUtil.ios
        .openDocument(filePath)
        .then(() => console.log("File opened successfully on iOS"))
        .catch(err => console.log('Error in opening file on iOS:', err));
    } else {
      // For Android
      console.log('Android file path:', item.uri);
      
      ReactNativeBlobUtil.android
        .actionViewIntent(item.uri, mimeType)
        .then(() => console.log("File opened successfully on Android"))
        .catch(err => console.log('Error in opening file on Android:', err));
    }
  };

  const handleRenderItem=({item})=>{
    return (
    <View style={connectionStyles.fileItem}>
      <View
      style={connectionStyles.fileInfoContainer}
      >
        {renderThumbnail(item?.mimeType)}
        <View style={connectionStyles.fileDetails}>
          <CustomText
          numberOfLines={1} fontFamily='Okra-Bold'fontSize={10}
          >
            {item.name}
          </CustomText>
          <CustomText
          numberOfLines={1} fontFamily='Okra-Medium' fontSize={8}
          >
            {item.mimeType}.{formatFileSize(item.size)}
          </CustomText>

        </View>
      </View>
      <TouchableOpacity
      onPress={() => handleOpen(item)}
      style={connectionStyles.openButton}

      >
        <CustomText
        numberOfLines={1}
        color='#fff'
        fontFamily='Okra-Bold'
        fontSize={9}
        >Open</CustomText>
      </TouchableOpacity>

    </View>
  )
  };
  

  return (
    <LinearGradient
    colors={['#FFFFFF','#bed3f4','#5892ea']}
    style={sendStyles.container}
    start={{x:0,y:1}}
    end={{x:0,y:0}}
    >
      <SafeAreaView/>
      <View style={sendStyles.mainContainer}>
        <CustomText
        fontFamily='Okra-Bold'
        fontSize={15}
        color='#fff'
        style={{textAlign:'center',margin:10}}
        >
          All Received Files
        </CustomText>
        {
          isLoading?(
            <ActivityIndicator size={'small'} color={Colors.primary}/>
          ): receivedFiles.length>0?
          (
            <FlatList
            data={receivedFiles}
            keyExtractor={item=>item.id}
            renderItem={handleRenderItem}
            contentContainerStyle={connectionStyles.fileList}
            />

          ):
          (
            <View
            style={connectionStyles.noDataContainer}
            >
              <CustomText
              numberOfLines={1}
              fontFamily='Okra-Medium'
              fontSize={11}
              >
                No files received Yet.
              </CustomText>

            </View>
          )
        }
        <TouchableOpacity
        onPress={goBack}
        style={sendStyles.backButton}
        >
          <Icon name='arrow-back' iconFamily='Ionicons' size={16} color='#000'/>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  
  )
}

export default ReceivedFileScreen

const styles = StyleSheet.create({})