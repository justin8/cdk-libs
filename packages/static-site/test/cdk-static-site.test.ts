import {
  expect as expectCDK,
  haveResource,
  SynthUtils,
  haveResourceLike
} from "@aws-cdk/assert";
import cdk = require("@aws-cdk/core");
import { StaticSite } from "../lib/index";
import { PriceClass } from "@aws-cdk/aws-cloudfront";
import { pathToFileURL } from "url";
import path = require("path");

let defaultProps: any = {};

const basicApp = new cdk.App();
const basicStack = new cdk.Stack(basicApp, "BasicStack");
new StaticSite(basicStack, "MyTestConstruct", defaultProps);

// Update snapshot with `npm test -- -u`
// Things to check with the snapshot:
// * Bucket policy is unchanged
// * CFNOutput of the domain name exists
test("Snapshot output is unchanged", () => {
  expect(SynthUtils.toCloudFormation(basicStack)).toMatchSnapshot();
});

test("S3 bucket created", () => {
  expectCDK(basicStack).to(haveResource("AWS::S3::Bucket"));
});

test("OAI created", () => {
  expectCDK(basicStack).to(
    haveResource("AWS::CloudFront::CloudFrontOriginAccessIdentity")
  );
});

test("Distribution created", () => {
  expectCDK(basicStack).to(haveResource("AWS::CloudFront::Distribution"));
});

test("Distribution config is correct", () => {
  expectCDK(basicStack).to(
    haveResourceLike("AWS::CloudFront::Distribution", {
      DistributionConfig: {
        PriceClass: PriceClass.PRICE_CLASS_ALL,
        IPV6Enabled: true,
        HttpVersion: "http2",
        DefaultRootObject: "index.html",
        Origins: [
          {
            DomainName: {
              "Fn::GetAtt": ["MyTestConstruct0062AECC", "RegionalDomainName"]
            }
          }
        ]
      }
    })
  );
});

// deployment function
test("Deployment is not run by default", () => {
  expectCDK(basicStack).notTo(haveResourceLike("Custom::CDKBucketDeployment"));
});

test("Deployment is run when source is specified", () => {
  let localProps = {
    ...defaultProps,
    source: { path: path.resolve("./test/stub-deployment") }
  };
  const basicApp = new cdk.App();
  const basicStack = new cdk.Stack(basicApp, "BasicStack");
  new StaticSite(basicStack, "MyTestConstruct", localProps);

  expectCDK(basicStack).to(haveResourceLike("Custom::CDKBucketDeployment"));
});

// test("Metric Filter group created", () => {
//   expectCDK(basicStack).to(haveResource("AWS::Logs::MetricFilter"));
// });

// test("Errors Alarm created", () => {
//   expectCDK(basicStack).to(
//     haveResource("AWS::CloudWatch::Alarm", {
//       MetricName: "MyTestConstructErrors"
//     })
//   );
// });

// test("No Logs Alarm created", () => {
//   expectCDK(basicStack).to(
//     haveResource("AWS::CloudWatch::Alarm", {
//       MetricName: "IncomingLogEvents",
//       Namespace: "AWS/Logs"
//     })
//   );
// });

// test("No logs alarm can be disabled", () => {
//   let localProps = { ...defaultProps };
//   localProps.noLogsAlarm = { enabled: false };
//   localProps.alarmsTopic = null;
//   const basicApp = new cdk.App();
//   const basicStack = new cdk.Stack(basicApp, "BasicStack");
//   new LogGroupWrapper(basicStack, "MyTestConstruct", localProps);
//   expectCDK(basicStack).notTo(
//     haveResource("AWS::CloudWatch::Alarm", {
//       MetricName: "IncomingLogEvents",
//       Namespace: "AWS/Logs"
//     })
//   );
// });

// test("Errors alarm can be disabled", () => {
//   let localProps = { ...defaultProps };
//   localProps.errorsAlarm = { enabled: false };
//   localProps.alarmsTopic = null;
//   const basicApp = new cdk.App();
//   const basicStack = new cdk.Stack(basicApp, "BasicStack");
//   new LogGroupWrapper(basicStack, "MyTestConstruct", localProps);
//   expectCDK(basicStack).notTo(
//     haveResource("AWS::CloudWatch::Alarm", {
//       MetricName: "MyTestConstructErrors"
//     })
//   );
// });

// test("Alarms are subscribed to given topic", () => {
//   expectCDK(basicStack).to(
//     haveResource("AWS::CloudWatch::Alarm", {
//       MetricName: "IncomingLogEvents",
//       Namespace: "AWS/Logs",
//       AlarmActions: [{ Ref: "topic69831491" }]
//     })
//   );
//   expectCDK(basicStack).to(
//     haveResource("AWS::CloudWatch::Alarm", {
//       MetricName: "MyTestConstructErrors",
//       AlarmActions: [{ Ref: "topic69831491" }]
//     })
//   );
// });

// test("No subscriptions when alarmsTopic is unspecified", () => {
//   let localProps = { ...defaultProps };
//   localProps.alarmsTopic = null;
//   const basicApp = new cdk.App();
//   const basicStack = new cdk.Stack(basicApp, "BasicStack");
//   new LogGroupWrapper(basicStack, "MyTestConstruct", localProps);
//   expectCDK(basicStack).notTo(
//     haveResource("AWS::CloudWatch::Alarm", {
//       AlarmActions: [{ Ref: "topic69831491" }]
//     })
//   );
// });
