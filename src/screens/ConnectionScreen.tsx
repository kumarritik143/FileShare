import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native'
import React, { FC, useEffect, useState } from 'react'
import { useTCP } from '../service/TCPProvider'
import Icon from '../components/global/Icon';
import { resetAndNavigate } from '../utils/NavigationUtil';
import LinearGradient from 'react-native-linear-gradient';
import { sendStyles } from '../styles/sendStyles';
import { SafeAreaView } from 'react-native';
import { connectionStyles } from '../styles/connectionStyles';
import CustomText from '../components/global/CustomText';
import Options from '../components/home/Options';
import { FlatList } from 'react-native';
import { formatFileSize } from '../utils/libraryHelpers';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Colors } from '../utils/Constants';

const ConnectionScreen:FC = () => {

  const {connectedDevice,disconnect,sendFileAck,sentFiles,receivedFiles,totalReceivedBytes,totalSentBytes,isConnected} = useTCP();

  const [activeTab, setActiveTab]= useState<'SENT' |'RECEIVED'>('SENT');


  const renderThumbnail =(mimType:string)=>{
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
  const onMediaPickedUp= (image:any)=>{
    console.log('Picked image:',image);
    sendFileAck(image,'image')
  }
  const onFilePickedUp=(file:any)=>{
    console.log("File is Picked",file);
    sendFileAck(file,'file')
  }

  useEffect(()=>{
    if(!isConnected){
      resetAndNavigate('HomeScreen')
    }
  },[isConnected])

  const handleTabChange=(tab:'SENT'|'RECEIVED')=>{
    setActiveTab(tab)

  }

 const renderItem=({item}:any)=>{
  return(
      <View style={connectionStyles.fileItem}>
        <View style={connectionStyles.fileInfoContainer}>
          {renderThumbnail(item?.mimType)}
          <View style={connectionStyles?.fileDetails}>
            <CustomText numberOfLines={1}
            fontFamily='Okra-Bold'
            fontSize={10}>
              {item?.name}
            </CustomText>
            <CustomText>
              {item?.mimType}. {formatFileSize(item.size)}
            </CustomText>
          </View>
        </View>

        {item?.available?(
          <TouchableOpacity
          style={connectionStyles.openButton}
          onPress={()=>{
            const normalizedPath=
            Platform.OS==='ios'?`file://${item?.uri}`:item?.uri;
            if(Platform.OS==='ios'){
              ReactNativeBlobUtil.ios.openDocument(normalizedPath)
              .then(()=>console.log('File Opened successfully'))
              .catch(err=>console.log("Error  in Opening file",err))
            }
            else{
              ReactNativeBlobUtil.android.
              actionViewIntent(normalizedPath,'*/*')
              .then(()=>console.log("File Opened successfully"))
              .catch(err=>console.log("Error in opening file",err))
            }
          }}>
            <CustomText
            numberOfLines={1}
            color='#fff'
            fontFamily='Okra-Bold'
            fontSize={9}
            >
              Open
            </CustomText>


        </TouchableOpacity>):(
          <ActivityIndicator color={Colors.primary} size="small"/>
        )}




      </View>
  )
 }


  return (
    <LinearGradient
    colors={['#FFFFFF','#CDDAEE','#8DBAFF']}
    style={sendStyles.container}
    start={{x:0,y:1}}
    end={{x:0,y:0}}
    >
      <SafeAreaView/>
      <View
      style={sendStyles.mainContainer}>

        <View style={connectionStyles.container}>
          <View style={connectionStyles.connectionContainer}>
            <View style={{width:'55%'}}>
              <CustomText numberOfLines={1} fontFamily='Okra-Medium'>
                Connected With
              </CustomText>
              
              <CustomText
              numberOfLines={1}
              fontFamily='Okra-Bold'
              fontSize={14}

              >
                {connectedDevice ||'Unknown'}

              </CustomText>

            </View>
            <TouchableOpacity
            onPress={()=>disconnect()}
            style={connectionStyles.disconnectButton}>
              <Icon
              name='remove-circle'
              size={12}
              color='red'
              iconFamily='Ionicons'
              />
              <CustomText
              numberOfLines={1}
              fontFamily='Okra-Bold'
              fontSize={10}>
                Disconnect
              </CustomText>

            </TouchableOpacity>

          </View>

            <Options
            onFilePickedUp={onFilePickedUp}
            onMediaPickedUp={onMediaPickedUp}
          />
          <View style={connectionStyles.fileContainer}>
            <View style={connectionStyles.sendReceiveContainer}>
              <View style={connectionStyles.sendReceiveButtonContainer}>

                <TouchableOpacity
                onPress={()=>handleTabChange('SENT')}
                style={[connectionStyles.sendReceiveButton, activeTab==='SENT'?connectionStyles.activeButton:connectionStyles.inactiveButton]}
                >
                  <Icon
                    name='cloud-upload'
                    size={12}
                    color={activeTab=='RECEIVED'? 'blue':'#fff'}
                    iconFamily='Ionicons'
                  />
                  <CustomText
                  numberOfLines={1}
                  fontFamily='Okra-Bold'
                  fontSize={9}
                  color={activeTab=='RECEIVED'? 'blue':'#fff'}>SENT</CustomText>
                </TouchableOpacity>


                <TouchableOpacity
                onPress={()=>handleTabChange('RECEIVED')}
                style={[connectionStyles.sendReceiveButton, activeTab==='RECEIVED'?connectionStyles.activeButton:connectionStyles.inactiveButton]}
                >
                  <Icon
                    name='cloud-upload'
                    size={12}
                    color={activeTab=='RECEIVED'? '#fff':'blue'}
                    iconFamily='Ionicons'
                  />
                  <CustomText
                  numberOfLines={1}
                  fontFamily='Okra-Bold'
                  fontSize={9}
                  color={activeTab=='RECEIVED'? '#fff':'#000'}>RECEIVED</CustomText>
                </TouchableOpacity>
              </View>
              
              <View style={connectionStyles.sendReceiveDataContainer}>
                <CustomText fontFamily='Okra-Bold' fontSize={9}>
                  {formatFileSize(
                    (activeTab==='SENT'
                      ?totalSentBytes
                      :totalReceivedBytes||0
                    )
                  )}
                </CustomText>
                <CustomText fontFamily='Okra-Bold' fontSize={12}>/</CustomText>

                <CustomText fontFamily='Okra-Bold' fontSize={10}>
                {
                  activeTab==='SENT'
                  ?formatFileSize(sentFiles?.reduce(
                    (total:number,file:any)=>total+file.size,0
                  ) || 0)
                  :formatFileSize(
                    receivedFiles?.reduce(
                      (total:number,file:any)=>total + file.size,0
                    ) || 0
                  )
                }
                </CustomText>

              </View>
          

            </View>





            {
             (activeTab==='SENT'
              ?sentFiles?.length
              :receivedFiles?.length
             )>0?(
              <FlatList
              data={activeTab==='SENT'?sentFiles:receivedFiles}
              keyExtractor={item=>item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={connectionStyles.fileList}
              />
             ):(
              <View style={connectionStyles.noDataContainer}>
                <CustomText
                numberOfLines={1}
                fontFamily='Okra-Medium'
                fontSize={11}>
                  {
                    activeTab==='SENT'
                    ?'No Files sent Yet.'
                    :'No Files received yet'
                  }

                </CustomText>
              </View>
             )
            }
           
          </View>


        </View>




        <TouchableOpacity
        onPress={()=>resetAndNavigate('HomeScreen')}
        style={sendStyles.backButton}
        >
          <Icon
            name='arrow-back'
            iconFamily='Ionicons'
            size={16}
            color='#000'
          />

        </TouchableOpacity>
      </View>

    </LinearGradient>
  )
}

export default ConnectionScreen