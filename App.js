import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";
import HomeScreen from "./src/screens/HomeScreen";
import Tasks from "./src/screens/Tasks";
import TimerScreen from "./src/screens/TimerScreen";

const navigator = createStackNavigator(
  {
    Home: HomeScreen,
    Tasks: Tasks,
    Timer: TimerScreen,
  },
  {
    initialRouteName: "Home",
    defaultNavigationOptions: {
      title: "App",
    },
  }
);

const AppContainer = createAppContainer(navigator);

export default AppContainer;
