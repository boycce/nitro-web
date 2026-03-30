declare namespace _default {
    namespace fields {
        namespace avatar {
            let type: string;
        }
        namespace company {
            let model: string;
            let required: boolean;
        }
        namespace email {
            let type_1: string;
            export { type_1 as type };
            let required_1: boolean;
            export { required_1 as required };
            export let index: string;
        }
        namespace isAdmin {
            let type_2: string;
            export { type_2 as type };
            let _default: boolean;
            export { _default as default };
        }
        namespace firstName {
            let type_3: string;
            export { type_3 as type };
            let required_2: boolean;
            export { required_2 as required };
        }
        namespace lastName {
            let type_4: string;
            export { type_4 as type };
            let required_3: boolean;
            export { required_3 as required };
        }
        namespace stripeCustomer {
            let type_5: string;
            export { type_5 as type };
        }
        namespace stripeSubscription {
            let type_6: string;
            export { type_6 as type };
        }
        namespace stripeIntents {
            let type_7: string;
            export { type_7 as type };
        }
        namespace usedFreeTrial {
            let type_8: string;
            export { type_8 as type };
            let _default_1: boolean;
            export { _default_1 as default };
        }
        namespace password {
            let type_9: string;
            export { type_9 as type };
            export let minLength: number;
        }
        namespace resetToken {
            let type_10: string;
            export { type_10 as type };
        }
    }
    let findBL: string[];
    let updateBL: string[];
    namespace messages {
        export namespace lastName_1 {
            let required_4: string;
            export { required_4 as required };
        }
        export { lastName_1 as lastName };
    }
    let beforeValidate: ((data: any) => Promise<void>)[];
    let afterFind: ((data: any) => Promise<any>)[];
    namespace methods {
        function loginPopulate(): any[];
    }
}
export default _default;
//# sourceMappingURL=user.d.ts.map