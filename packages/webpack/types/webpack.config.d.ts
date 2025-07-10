export function getConfig(config: any): (env: any, argv: any) => {
    devtool: string | boolean;
    entry: string;
    mode: string;
    externals: any[];
    target: any;
    devServer: {
        allowedHosts: string;
        client: {
            logging: string;
            overlay: boolean;
        };
        compress: boolean;
        devMiddleware: {
            writeToDisk: boolean;
        };
        historyApiFallback: boolean;
        host: string;
        hot: boolean;
        port: number;
        proxy: {
            '/api': {
                logLevel: string;
                target: string;
            };
            '/email': {
                logLevel: string;
                target: string;
            };
        };
    };
    infrastructureLogging: {
        level: string;
    };
    module: {
        rules: ({
            test: RegExp;
            use: ({
                loader: string;
                options?: undefined;
            } | {
                loader: string;
                options: {
                    sourceMap: boolean;
                    postcssOptions?: undefined;
                };
            } | {
                loader: string;
                options: {
                    postcssOptions: {
                        plugins: any[];
                    };
                    sourceMap: boolean;
                };
            })[];
            exclude?: undefined;
            loader?: undefined;
            options?: undefined;
            type?: undefined;
            generator?: undefined;
        } | {
            test: RegExp;
            exclude: (path: any) => boolean;
            use: {
                loader: string;
                options: {
                    presets: ((string | {
                        debug: boolean;
                    })[] | (string | {
                        allowNamespaces: boolean;
                    })[] | (string | {
                        runtime: string;
                        importSource: string;
                        development: boolean;
                    })[])[];
                    plugins: (string | (string | {
                        twin: {
                            preset: string;
                            config: string;
                        };
                    })[])[];
                };
            }[];
            loader?: undefined;
            options?: undefined;
            type?: undefined;
            generator?: undefined;
        } | {
            test: RegExp;
            loader: string;
            options: {
                search: string;
                replace: string;
            };
            use?: undefined;
            exclude?: undefined;
            type?: undefined;
            generator?: undefined;
        } | {
            test: RegExp;
            use: {
                loader: string;
                options: {
                    delimiter: string;
                    header: boolean;
                    skipEmptyLines: boolean;
                };
            }[];
            exclude?: undefined;
            loader?: undefined;
            options?: undefined;
            type?: undefined;
            generator?: undefined;
        } | {
            test: RegExp;
            type: string;
            generator: {
                filename: string;
            };
            use?: undefined;
            exclude?: undefined;
            loader?: undefined;
            options?: undefined;
        } | {
            test: RegExp;
            use: {
                loader: string;
                options: {
                    svgoConfig: {
                        plugins: ({
                            name: string;
                            params: {
                                overrides: {
                                    removeViewBox: boolean;
                                    convertPathData: boolean;
                                    cleanupNumericValues: boolean;
                                    convertShapeToPath: boolean;
                                };
                            };
                            fn?: undefined;
                        } | {
                            name: string;
                            fn: (root: any, _params: any, info: any) => void;
                            params?: undefined;
                        })[];
                    };
                };
            }[];
            exclude?: undefined;
            loader?: undefined;
            options?: undefined;
            type?: undefined;
            generator?: undefined;
        })[];
    };
    node: {
        __filename: boolean;
    };
    output: {
        filename: string;
        path: any;
        publicPath: string;
    };
    performance: {
        hints: boolean;
    };
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: RegExp;
                    name: string;
                    chunks: string;
                };
            };
        };
        minimize: boolean;
    };
    plugins: any[];
    resolve: {
        extensions: string[];
        alias: {
            componentsDir: any;
        };
    };
    stats: {
        all: boolean;
        assets: boolean;
        errors: boolean;
        errorDetails: boolean;
        timings: boolean;
        warnings: boolean;
    };
    watchOptions: {
        aggregateTimeout: number;
        ignored: RegExp;
    };
}[];
//# sourceMappingURL=webpack.config.d.ts.map