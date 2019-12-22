# CDK Alarms Stack

This is a very short and simple wrapper to create an SNS topic and subscribe a list of email addresses to the topic. It is just a shorter and more readable form to insert in to a CDK app for use with CloudWatch alarms

# Usage

```
  const app = new cdk.App();
  const stack = new alarmsStack(app, "TestStack", {
      alarmEmails: ["me@example.com", "someoneElse@foo.xyz"],
      alarmsTopicName: "someTopic"
  });
```

The above will generate:

- An SNS topic named "someTopic"
- 2 email subscriptions, one for each of the given emails
- The alarm topic is accessible at `stack.alarmsTopic`
