import React from 'react';
import { Image, Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';
import {Ionicons} from '@expo/vector-icons';
import Header from 'react-native-elements';

import HomeScreen from '../screens/HomeScreen';
import ListScreen from '../screens/ListScreen';
import GroceryListScreen from '../screens/GroceryListScreen';

const HomeStack = createStackNavigator({Home: HomeScreen});
  
const ListStack = createStackNavigator({List: ListScreen});

const GroceryListStack = createStackNavigator({Grocery: GroceryListScreen});

export default createBottomTabNavigator(
    {
      List: {screen: ListStack},
      Home: {screen: HomeStack},
      Grocery: {screen: GroceryListStack},
    },
    {
      defaultNavigationOptions: ({ navigation }) => ({
        tabBarIcon: ({ focused, tintColor }) => {
          const { routeName } = navigation.state;
          let iconName;
          if (routeName === 'Home') {
            iconName = 'ios-camera';
          } 
          else if(routeName==='List'){
            iconName = 'ios-list-box';
          }
          else if(routeName === 'Grocery'){
            iconName = 'local-grocery-store';
          }
  
          // You can return any component that you like here! We usually use an
          // icon component from react-native-vector-icons
          return <Ionicons name={iconName} size={27} color={tintColor} />;
        }
      }),
      tabBarOptions: {
        activeTintColor: '#99cfe0',
        inactiveTintColor: 'gray',
        showLabel:false,
      },
    }
  );
  