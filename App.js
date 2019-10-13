import React from "react";
import { Font, AppLoading, SplashScreen } from "expo";
import { Asset } from "expo-asset";
import AppNavigator from "./AppNavigator";

export default class App extends React.Component {
  state = {
    isLoadingComplete: false
  };

  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
          autoHideSplash={false}
        />
      );
    } else {
      return <AppNavigator />;
    }
  }

  async _loadResourcesAsync() {
    await Asset.loadAsync([
      require("./assets/icon.png"),
      require("./assets/auth.png")
    ]);
  }

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
    SplashScreen.hide();
  };
}
