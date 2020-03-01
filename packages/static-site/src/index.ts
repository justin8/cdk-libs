import { Construct, CfnOutput } from "@aws-cdk/core";
import s3 = require("@aws-cdk/aws-s3");
import s3deploy = require("@aws-cdk/aws-s3-deployment");
import {
  OriginAccessIdentity,
  CloudFrontWebDistribution,
  PriceClass,
  CloudFrontWebDistributionProps,
  ViewerCertificate
} from "@aws-cdk/aws-cloudfront";
import acm = require("@aws-cdk/aws-certificatemanager");
import { PolicyStatement } from "@aws-cdk/aws-iam";
import iam = require("@aws-cdk/aws-iam");
import { Certificate } from "@aws-cdk/aws-certificatemanager";

export interface StaticSiteProps {
  source?: {
    path: string;
  };
  bucketProps?: {};
  domainName?: string;
}

export class StaticSite extends Construct {
  public bucket: s3.Bucket;
  public distribution: CloudFrontWebDistribution;

  constructor(parent: Construct, name: string, props: StaticSiteProps) {
    super(parent, name);

    this.bucket = new s3.Bucket(this, "bucket", props.bucketProps);
    const siteOAI = new OriginAccessIdentity(this, "OAI");

    let viewerCertificate: ViewerCertificate = ViewerCertificate.fromCloudFrontDefaultCertificate();

    if (props.domainName) {
      const certificate = new Certificate(this, "certificate", {
        domainName: props.domainName
      });

      viewerCertificate = ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [props.domainName]
      });
    }

    let distributionProps: CloudFrontWebDistributionProps = {
      priceClass: PriceClass.PRICE_CLASS_ALL,
      viewerCertificate: viewerCertificate,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.bucket,
            originAccessIdentity: siteOAI
          },
          behaviors: [{ isDefaultBehavior: true }]
        }
      ]
    };

    this.distribution = new CloudFrontWebDistribution(
      this,
      "Distribution",
      distributionProps
    );

    const cloudfrontBucketPolicy = new PolicyStatement();
    cloudfrontBucketPolicy.addActions("s3:GetObject");
    cloudfrontBucketPolicy.addResources(this.bucket.arnForObjects("*"));
    cloudfrontBucketPolicy.effect = iam.Effect.ALLOW;
    cloudfrontBucketPolicy.addCanonicalUserPrincipal(
      siteOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );
    this.bucket.addToResourcePolicy(cloudfrontBucketPolicy);

    if (props.source) {
      new s3deploy.BucketDeployment(this, `${name}Deployment`, {
        sources: [s3deploy.Source.asset(props.source.path)],
        destinationBucket: this.bucket,
        distribution: this.distribution,
        distributionPaths: ["/*"]
      });
    }

    new CfnOutput(this, "URL", {
      value: this.distribution.domainName
    });
  }
}
