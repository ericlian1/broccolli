import React from "react";
import { Platform, View, ActivityIndicator, AsyncStorage } from "react-native";
import { AppLoading, SplashScreen } from "expo";
import MainTabNavigator from "./MainTabNavigator";
import SignInScreen from "./screens/SignInScreen";
import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import { createBottomTabNavigator } from "react-navigation-tabs";

// Implementation of HomeScreen, OtherScreen, SignInScreen, AuthLoadingScreen
// goes here.

class LoadingScreen extends React.Component {
  constructor() {
    super();

    this._bootstrapAsync();
  }

  // Fetch the token from storage then navigate to our appropriate place
  async _bootstrapAsync() {
    const userToken = await AsyncStorage.getItem("userToken");
    // This will switch to the App screen or Auth screen and this loading
    // screen will be unmounted and thrown away.
    this.props.navigation.navigate(userToken ? "Home" : "Auth");
  }

  // Render any loading content that you like here
  render() {
    return <AppLoading autoHideSplash={false} />;
  }
}

const AuthStack = createStackNavigator({ SignIn: SignInScreen });
const LoadingStack = createStackNavigator({ Load: LoadingScreen });

export default createAppContainer(createSwitchNavigator(
  {
    //Todo: add AuthLoading: AuthLoadingScreen,
    App: MainTabNavigator,
    Auth: AuthStack,
    Loading: LoadingStack
  },
  {
    initialRouteName: "Loading"
  }
));
