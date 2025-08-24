import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FC } from 'react';
import {RFValue} from 'react-native-responsive-fontsize'

interface IconProps{
    color?:string;
    size:number;
    name:string;
    iconFamily: 'Ionicons'|'MaterialCommunityIcons'|'MaterialIcons';
}

const Icon = ({ color, size, name, iconFamily }:IconProps)=>{
    return(
    <>
    {
        iconFamily==='Ionicons'&&(
            <Ionicons name={name} color={color} size={RFValue(size)}/>
        )
    }

    { iconFamily==='MaterialIcons'&&(
        <MaterialIcons name={name} color={color} size={RFValue(size)}/>
    )}
    {
        iconFamily==='MaterialCommunityIcons'&&(
            <MaterialCommunityIcons
            name={name}
            color={color}
            size={RFValue(size)}
            />
        )
    }
    </>
    )

}
export default Icon