export interface MinioConfig {
    getMinioEndpoint(): string;
    getMinioPort(): number;
    getMinioAccessKey(): string;
    getMinioSecretKey(): string;
    getMinioUseSsl(): boolean;
    getMinioBucketName(): string;
}
