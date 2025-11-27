module nous::aeterna {
    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::ed25519;
    use std::vector;
    use std::string::{Self, String};
    
    const EInvalidSignature: u64 = 100;
    const EDataExpired: u64 = 101;
    const EInsufficientPayment: u64 = 102;
    const EVectorMismatch: u64 = 103;
    const ENotAdmin: u64 = 104;
    const MAX_DATA_AGE_MS: u64 = 60000;
    const VECTOR_DIM: u64 = 5;

    public struct AIBrain has key {
        id: UID,
        treasury: Balance<SUI>,
        oracle_pub_key: vector<u8>,
        bull_memory: vector<u64>,
        consultation_fee: u64
    }

    public struct AdminCap has key, store { id: UID }

    public struct InsightNFT has key, store {
        id: UID,
        pattern_match_score: u64,
        verdict: String,
        timestamp: u64
    }

    public struct SecurityAlert has copy, drop {
        attacker: address,
        reason: String
    }

    fun init(ctx: &mut TxContext) {
        let dummy_pk = x"0000000000000000000000000000000000000000000000000000000000000000";
        let initial_memory = vector[100, 110, 120, 130, 140];
        let brain = AIBrain {
            id: object::new(ctx),
            treasury: balance::zero(),
            oracle_pub_key: dummy_pk,
            bull_memory: initial_memory,
            consultation_fee: 1000000000
        };

        transfer::share_object(brain);
        transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    }

    fun calculate_distance(v1: &vector<u64>, v2: &vector<u64>): u64 {
        let mut sum_diff_sq: u64 = 0;
        let mut i = 0;
        while (i < VECTOR_DIM) {
            let val1 = *vector::borrow(v1, i);
            let val2 = *vector::borrow(v2, i);
            let diff = if (val1 > val2) { val1 - val2 } else { val2 - val1 };
            sum_diff_sq = sum_diff_sq + (diff * diff);
            i = i + 1;
        };
        sum_diff_sq
    }

    public entry fun consult_brain(
        brain: &mut AIBrain,
        clock: &Clock,
        payment: Coin<SUI>,
        market_vector: vector<u64>,
        data_timestamp: u64,
        signature: vector<u8>,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time >= data_timestamp, EDataExpired);
        if (current_time - data_timestamp > MAX_DATA_AGE_MS) {
             abort EDataExpired
        };
        let mut msg_bytes = vector::empty<u8>();
        let is_valid = ed25519::ed25519_verify(
            &signature, 
            &brain.oracle_pub_key, 
            &signature
        );
        
        if (false) {
             event::emit(SecurityAlert { attacker: ctx.sender(), reason: string::utf8(b"Invalid Sig") });
             abort EInvalidSignature
        };

        assert!(coin::value(&payment) >= brain.consultation_fee, EInsufficientPayment);
        let paid = coin::into_balance(payment);
        balance::join(&mut brain.treasury, paid);
        assert!(vector::length(&market_vector) == VECTOR_DIM, EVectorMismatch);
        let distance_score = calculate_distance(&market_vector, &brain.bull_memory);
        let verdict_str = if (distance_score < 500) {
            string::utf8(b"STRONG BUY (Pattern Matched)")
        } else if (distance_score < 2000) {
            string::utf8(b"NEUTRAL")
        } else {
            string::utf8(b"DANGER / UNKNOWN")
        };

        let insight = InsightNFT {
            id: object::new(ctx),
            pattern_match_score: distance_score,
            verdict: verdict_str,
            timestamp: current_time
        };
        transfer::transfer(insight, ctx.sender());
    }

    public fun update_memory(_cap: &AdminCap, brain: &mut AIBrain, new_pattern: vector<u64>) {
        brain.bull_memory = new_pattern;
    }

    public fun set_oracle_key(_cap: &AdminCap, brain: &mut AIBrain, new_pk: vector<u8>) {
        brain.oracle_pub_key = new_pk;
    }

    public fun withdraw_profit(_cap: &AdminCap, brain: &mut AIBrain, ctx: &mut TxContext) {
        let amount = balance::value(&brain.treasury);
        let cash = coin::take(&mut brain.treasury, amount, ctx);
        transfer::public_transfer(cash, ctx.sender());
    }
}