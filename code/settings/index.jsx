//Version: h*** (heart-rate, socket/fetch, DoryNode/Heroku, view/download)

function settingsComponent(props) {
  return (
    <Page>
      <Text><Text bold>Heart rate: </Text>{props.settingsStorage.getItem('hr')}</Text>
      <Text><Text bold>Time: </Text>{props.settingsStorage.getItem('time')}</Text>
    </Page>
  )
}

registerSettingsPage(settingsComponent);