import { expect as expectCDK, haveResource, SynthUtils } from "@aws-cdk/assert";
import cdk = require("@aws-cdk/core");
import { alarmsStack } from "../lib/index";

const props = {
  alarmEmails: ["me@example.com"],
  alarmsTopicName: "someTopic"
};

test("SNS Subscription Created", () => {
  const app = new cdk.App();
  const stack = new alarmsStack(app, "TestStack", props);
  expectCDK(stack).to(
    haveResource("AWS::SNS::Subscription", {
      Protocol: "email",
      Endpoint: props.alarmEmails[0],
      TopicArn: { Ref: "alarmsTopicF96CFF7B" } // Object name is deterministic
    })
  );
});

test("SNS Topic Created", () => {
  const app = new cdk.App();
  const stack = new alarmsStack(app, "TestStack", props);
  expectCDK(stack).to(
    haveResource("AWS::SNS::Topic", { TopicName: "alarmsTopic" })
  );
});
