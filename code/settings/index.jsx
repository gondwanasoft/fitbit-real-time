//Version: a___ (accelerometer, socket/fetch, DoryNode/Heroku, view/save)

function settingsComponent(props) {
  return (
    <Page>
      <Text><Text bold>x: </Text>{props.settingsStorage.getItem('x')}</Text>
      <Text><Text bold>y: </Text>{props.settingsStorage.getItem('y')}</Text>
      <Text><Text bold>z: </Text>{props.settingsStorage.getItem('z')}</Text>
      <Text><Text bold>Time: </Text>{props.settingsStorage.getItem('time')}</Text>
    </Page>
  )
}

registerSettingsPage(settingsComponent);