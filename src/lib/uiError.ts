import { Alert } from 'react-native';

const GENERIC_ERROR_MESSAGE = 'Ha ocurrido un error, inténtalo de nuevo';

export function showGenericErrorAlert() {
  Alert.alert(GENERIC_ERROR_MESSAGE);
}