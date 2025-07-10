declare namespace _default {
    namespace fields {
        namespace business {
            let address: {
                city: {
                    type: string;
                };
                country: {
                    type: string;
                    default: string;
                };
                full: {
                    type: string;
                    index: string;
                };
                line1: {
                    type: string;
                };
                line2: {
                    type: string;
                };
                number: {
                    type: string;
                };
                postcode: {
                    type: string;
                };
                suburb: {
                    type: string;
                };
                unit: {
                    type: string;
                };
                area: {
                    bottomLeft: {
                        type: string;
                    }[];
                    topRight: {
                        type: string;
                    }[];
                };
                location: {
                    index: string;
                    type: {
                        type: string;
                        default: string;
                    };
                    coordinates: [];
                };
            };
            namespace country {
                export let type: string;
                let _default: string;
                export { _default as default };
                export let required: boolean;
            }
            namespace currency {
                let type_1: string;
                export { type_1 as type };
                let _default_1: string;
                export { _default_1 as default };
                let required_1: boolean;
                export { required_1 as required };
            }
            namespace name {
                let type_2: string;
                export { type_2 as type };
                let required_2: boolean;
                export { required_2 as required };
                export let index: string;
            }
            namespace number {
                let type_3: string;
                export { type_3 as type };
            }
            namespace phone {
                let type_4: string;
                export { type_4 as type };
            }
            namespace website {
                let type_5: string;
                export { type_5 as type };
                export let isURL: boolean;
            }
        }
        namespace status {
            let type_6: string;
            export { type_6 as type };
            let _default_2: string;
            export { _default_2 as default };
            let _enum: string[];
            export { _enum as enum };
        }
        let users: {
            _id: {
                model: string;
            };
            role: {
                type: string;
                enum: string[];
            };
            status: {
                type: string;
                required: boolean;
                enum: string[];
            };
            inviteEmail: {
                type: string;
            };
            inviteToken: {
                type: string;
            };
        }[];
    }
    let findBL: string[];
    let updateBL: string[];
    let afterFind: ((data: any) => Promise<void>)[];
    namespace methods {
        function publicData(models: any): any;
        function loginPopulate(): {
            as: string;
            from: string;
            let: {
                users: string;
            };
            pipeline: ({
                $match: {
                    $expr: {
                        $in: string[];
                    };
                };
                $project?: undefined;
            } | {
                $project: {
                    createdAt: number;
                    email: number;
                    firstName: number;
                    lastName: number;
                    avatar: number;
                };
                $match?: undefined;
            })[];
        }[];
    }
}
export default _default;
//# sourceMappingURL=company.d.ts.map