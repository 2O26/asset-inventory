const createDataView = async () => {
    const url = "http://localhost:5601/api/saved_objects/index-pattern/my-data-view";
    const data = {
      attributes: {
        title: "fluentd-*",
        timeFieldName: "@timestamp",
      },
    };

    try {
        const response = await fetch(url, {
          method: 'POST', // The HTTP method
          headers: {
            'kbn-xsrf': 'true', // CSRF protection header specific to Kibana
            'Content-Type': 'application/json', // Specifies the format of the payload
          },
          body: JSON.stringify(data), // Converts the JavaScript object to a JSON string
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const result = await response.json();
        // console.log('Success:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};

export const RedirectToLogServer = async () => {
    await createDataView();
    window.open("http://localhost:5601/app/discover#/", "_blank");

}