declare namespace _default {
    namespace fields {
        export namespace avatar {
            let type: string;
        }
        export namespace company {
            let model: string;
            let required: boolean;
        }
        export namespace email {
            let type_1: string;
            export { type_1 as type };
            let required_1: boolean;
            export { required_1 as required };
            export let index: string;
        }
        export namespace firstName {
            let type_2: string;
            export { type_2 as type };
            let required_2: boolean;
            export { required_2 as required };
        }
        export namespace lastName {
            let type_3: string;
            export { type_3 as type };
            let required_3: boolean;
            export { required_3 as required };
        }
        export namespace password {
            let type_4: string;
            export { type_4 as type };
            export let minLength: number;
        }
        export namespace resetToken {
            let type_5: string;
            export { type_5 as type };
        }
        export namespace status {
            let type_6: string;
            export { type_6 as type };
            let _default: string;
            export { _default as default };
            let _enum: string[];
            export { _enum as enum };
        }
        export namespace stripeCustomer {
            let type_7: string;
            export { type_7 as type };
        }
        export namespace stripeSubscription {
            let type_8: string;
            export { type_8 as type };
        }
        export namespace stripeIntents {
            let type_9: string;
            export { type_9 as type };
        }
        export namespace type_10 {
            let type_11: string;
            export { type_11 as type };
            let _default_1: string;
            export { _default_1 as default };
            let _enum_1: string[];
            export { _enum_1 as enum };
        }
        export { type_10 as type };
        export namespace usedFreeTrial {
            let type_12: string;
            export { type_12 as type };
            let _default_2: boolean;
            export { _default_2 as default };
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