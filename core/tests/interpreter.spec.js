/**
 * Interpreter Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('Rexx-lite Interpreter', () => {
  let kitchenService;
  let addressSender;

  beforeEach(() => {
    kitchenService = new MockKitchenService();
    kitchenService.reset(); // Reset to test inventory values
    addressSender = kitchenService.createRpcClient();
  });

  it('should execute a single command and modify internal state', async () => {
    const script = 'createMeal potatoes=2 chicken=1';
    const commands = parse(script);

    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);

    // Assert internal state was modified
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      potatoes: 2,
      chicken: 1
    });

    // Assert inventory was decremented
    const inventory = kitchenService.getInventory();
    expect(inventory.potatoes).toBe(8); // Started with 10, used 2
    expect(inventory.chicken).toBe(4);  // Started with 5, used 1
  });

  it('should handle ADDRESS commands to change the RPC namespace', async () => {
    const script = `
      ADDRESS appliance
      preheatOven temperature=375
    `;
    const commands = parse(script);
    
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);

    // Assert appliance state was modified
    const appliances = kitchenService.getAppliances();
    expect(appliances.oven.status).toBe('heating');
    expect(appliances.oven.temperature).toBe(375);
  });

  it('should handle variable assignment from command results', async () => {
    const script = 'LET meal1 = createMeal potatoes=1 rice=2';
    const commands = parse(script);

    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);

    // Check that the variable was stored correctly
    const mealVar = interpreter.getVariable('meal1');
    expect(mealVar.id).toBe('meal-1');
    expect(mealVar.ingredients).toEqual({
      potatoes: 1,
      rice: 2
    });

    // Also verify the kitchen service state
    expect(kitchenService.getMeals()).toHaveLength(1);
    expect(kitchenService.getInventory().potatoes).toBe(9);
    expect(kitchenService.getInventory().rice).toBe(18);
  });

  it('should substitute variables in subsequent commands', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=chicken
      ADDRESS kitchen
      createMeal chicken=stock.quantity rice=3
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);

    // The stock check should return quantity=5 (initial chicken inventory)
    // Then createMeal should use all 5 chickens
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients.chicken).toBe(5);
    expect(kitchenService.getInventory().chicken).toBe(0);
  });

  it('should handle complex meal preparation workflow', async () => {
    const script = `
      -- Prepare the oven
      ADDRESS appliance
      preheatOven temperature=400
      
      -- Check inventory
      ADDRESS inventory
      LET chickStock = checkStock item=chicken
      
      -- Create the meal
      ADDRESS kitchen
      LET dinner = createMeal chicken=2 potatoes=3 spices=true
      prepareDish name='Side Salad' servings=4
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);

    // Verify multiple aspects of the state
    const appliances = kitchenService.getAppliances();
    expect(appliances.oven.temperature).toBe(400);
    
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(2);
    
    // First meal (dinner)
    expect(meals[0].ingredients).toEqual({
      chicken: 2,
      potatoes: 3,
      spices: 1
    });
    
    // Second meal (salad)
    expect(meals[1].name).toBe('Side Salad');
    expect(meals[1].servings).toBe(4);
    
    // Check inventory changes
    const inventory = kitchenService.getInventory();
    expect(inventory.chicken).toBe(3);  // 5 - 2
    expect(inventory.potatoes).toBe(7); // 10 - 3
    expect(inventory.spices).toBe(29);  // 30 - 1
  });

  it('should handle inventory operations', async () => {
    const script = `
      ADDRESS inventory
      LET before = checkStock item=vegetables
      addStock item=vegetables quantity=5
      LET after = checkStock item=vegetables
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    expect(interpreter.getVariable('before').quantity).toBe(15);
    expect(interpreter.getVariable('after').quantity).toBe(20);
    expect(kitchenService.getInventory().vegetables).toBe(20);
  });

  it('should execute IF statement with true condition', async () => {
    const script = `
      ADDRESS kitchen
      LET test_value = 5
      IF true THEN
        createMeal chicken=2
      ENDIF
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Condition should be true, so meal should be created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients.chicken).toBe(2);
    expect(kitchenService.getInventory().chicken).toBe(3); // 5 - 2 (reset sets chicken to 5)
  });

  it('should execute IF statement with false condition', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=chicken
      IF stock.quantity > 10 THEN
        ADDRESS kitchen
        createMeal chicken=5
      ENDIF
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Condition should be false (chicken=5 > 10), so no meal should be created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(0);
    expect(kitchenService.getInventory().chicken).toBe(5); // Unchanged
  });

  it('should execute IF/ELSE statement with false condition', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=chicken
      IF stock.quantity > 10 THEN
        ADDRESS kitchen
        createMeal chicken=5
      ELSE
        ADDRESS kitchen
        prepareDish name='Vegetarian Option' servings=3
      ENDIF
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Condition should be false (5 > 10), so ELSE branch should execute
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe('Vegetarian Option');
    expect(meals[0].servings).toBe(3);
    expect(kitchenService.getInventory().chicken).toBe(5); // Unchanged since ELSE block uses prepareDish, not createMeal
  });

  it('should handle nested IF statements', async () => {
    const script = `
      ADDRESS inventory
      LET chickenStock = checkStock item=chicken
      LET potatoStock = checkStock item=potatoes
      IF chickenStock.quantity > 2 THEN
        IF potatoStock.quantity > 5 THEN
          ADDRESS kitchen
          createMeal chicken=2 potatoes=3
        ELSE
          ADDRESS kitchen
          createMeal chicken=1
        ENDIF
      ENDIF
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Both conditions should be true (chicken=5>2, potatoes=10>5)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      chicken: 2,
      potatoes: 3
    });
  });

  it('should handle different comparison operators', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=rice
      IF stock.quantity = 20 THEN
        ADDRESS kitchen
        prepareDish name='Rice Bowl' servings=4
      ENDIF
      
      ADDRESS inventory
      LET chickenStock = checkStock item=chicken
      IF chickenStock.quantity >= 5 THEN
        ADDRESS kitchen
        createMeal chicken=1
      ENDIF
      
      ADDRESS inventory
      LET potatoStock = checkStock item=potatoes
      IF potatoStock.quantity <= 15 THEN
        ADDRESS kitchen
        prepareDish name='Light Meal' servings=2
      ENDIF
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // All conditions should be true: rice=20, chicken>=5, potatoes<=15
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(3);
    expect(meals[0].name).toBe('Rice Bowl');
    expect(meals[1].ingredients.chicken).toBe(1);
    expect(meals[2].name).toBe('Light Meal');
  });

  it('should handle boolean conditions', async () => {
    // First set up a variable that evaluates to true
    kitchenService.getInventory().hasSpecialIngredients = true;
    
    const script = `
      ADDRESS inventory
      LET special = checkStock item=hasSpecialIngredients
      IF special THEN
        ADDRESS kitchen
        prepareDish name='Special Dish' servings=6
      ENDIF
    `;
    
    // Mock the checkStock to return the boolean
    const originalHandle = kitchenService.handleInventoryMethod;
    kitchenService.handleInventoryMethod = function(method, params) {
      if (method === 'checkStock' && params.item === 'hasSpecialIngredients') {
        return true;
      }
      return originalHandle.call(this, method, params);
    };
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Boolean condition should be true
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe('Special Dish');
    
    // Restore original handler
    kitchenService.handleInventoryMethod = originalHandle;
  });

  it('should execute DO range loop', async () => {
    const script = `
      DO i = 1 TO 3
        prepareDish name='Meal' servings=i
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 3 dishes with servings 1, 2, 3
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(3);
    expect(meals[0].servings).toBe(1);
    expect(meals[1].servings).toBe(2);
    expect(meals[2].servings).toBe(3);
    
    // Loop variable should persist after loop with final value (standard Rexx behavior)
    expect(interpreter.getVariable('i')).toBe(3);
  });

  it('should execute DO range loop with step', async () => {
    const script = `
      DO count = 1 TO 4 BY 1
        prepareDish name='Dish' servings=count
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 4 dishes with servings 1,2,3,4
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(4);
    expect(meals[0].servings).toBe(1);
    expect(meals[1].servings).toBe(2);
    expect(meals[2].servings).toBe(3);
    expect(meals[3].servings).toBe(4);
  });

  it('should execute DO repeat loop', async () => {
    const script = `
      DO 4
        prepareDish name='Snack' servings=1
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 4 identical dishes
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(4);
    meals.forEach(meal => {
      expect(meal.name).toBe('Snack');
      expect(meal.servings).toBe(1);
    });
  });

  it('should execute DO WHILE loop', async () => {
    const script = `
      ADDRESS inventory
      LET counter = checkStock item=spices
      DO WHILE counter.quantity > 27
        ADDRESS kitchen
        prepareDish name='Item' servings=1
        ADDRESS inventory
        LET counter = useSpice amount=1
      END
    `;
    
    // Mock useSpice to decrement spices and return new count
    const originalHandle = kitchenService.handleInventoryMethod;
    kitchenService.handleInventoryMethod = function(method, params) {
      if (method === 'useSpice') {
        this.inventory.spices -= params.amount;
        return { quantity: this.inventory.spices };
      }
      return originalHandle.call(this, method, params);
    };
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 3 items (spices: 30>27✓ prep1, 29>27✓ prep2, 28>27✓ prep3, then 27>27✗ stop)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(3);
    expect(kitchenService.getInventory().spices).toBe(27);
    
    // Restore original handler
    kitchenService.handleInventoryMethod = originalHandle;
  });

  it('should handle nested DO loops', async () => {
    const script = `
      DO i = 1 TO 2
        DO j = 1 TO 2
          prepareDish name='Combo' servings=i time=j
        END
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 4 dishes with combinations of servings and time
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(4);
    expect(meals[0].servings).toBe(1);
    expect(meals[0].time).toBe(1);
    expect(meals[1].servings).toBe(1);
    expect(meals[1].time).toBe(2);
    expect(meals[2].servings).toBe(2);
    expect(meals[2].time).toBe(1);
    expect(meals[3].servings).toBe(2);
    expect(meals[3].time).toBe(2);
  });

  it('should handle DO loops with variable ranges', async () => {
    const script = `
      ADDRESS inventory
      LET startStock = checkStock item=chicken
      LET endStock = checkStock item=rice
      ADDRESS kitchen
      DO i = startStock.quantity TO endStock.quantity
        prepareDish name='Variable' servings=i
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 16 dishes with servings 5,6,7,...,20 (chicken=5, rice=20)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(16);
    expect(meals[0].servings).toBe(5);
    expect(meals[1].servings).toBe(6);
    expect(meals[15].servings).toBe(20);
  });

  it('should handle reverse DO loops', async () => {
    const script = `
      DO i = 5 TO 3
        prepareDish name='Countdown' servings=i
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should create 3 dishes counting down: 5, 4, 3
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(3);
    expect(meals[0].servings).toBe(5);
    expect(meals[1].servings).toBe(4);
    expect(meals[2].servings).toBe(3);
  });

  it('should preserve loop variable scope', async () => {
    const script = `
      ADDRESS inventory
      LET i = checkStock item=spices
      ADDRESS kitchen
      DO i = 1 TO 2
        prepareDish name='Loop' servings=i
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Original value should be restored
    expect(interpreter.getVariable('i')).toEqual({ item: 'spices', quantity: 30 });
    
    // But loop should have executed with loop values
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(2);
    expect(meals[0].servings).toBe(1);
    expect(meals[1].servings).toBe(2);
  });

  it('should execute SELECT statement with matching WHEN clause', async () => {
    const script = `
      ADDRESS kitchen
      LET test_value = 8
      SELECT
        WHEN test_value > 10 THEN
          prepareDish name='Feast' servings=8
        WHEN test_value > 3 THEN
          createMeal chicken=2 potatoes=3
        OTHERWISE
          prepareDish name='Light Meal' servings=1
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should match second WHEN clause (8 > 3 but not > 10)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      chicken: 2,
      potatoes: 3
    });
    
    // Verify inventory was decremented
    const inventory = kitchenService.getInventory();
    expect(inventory.chicken).toBe(3);  // 5 - 2
    expect(inventory.potatoes).toBe(7); // 10 - 3
  });

  it('should execute SELECT statement with OTHERWISE clause when no WHEN matches', async () => {
    const script = `
      ADDRESS inventory  
      LET stock = checkStock item=chicken
      ADDRESS kitchen
      SELECT
        WHEN stock.quantity > 20 THEN
          prepareDish name='Huge Feast' servings=15
        WHEN stock.quantity > 15 THEN
          prepareDish name='Big Meal' servings=10
        OTHERWISE
          prepareDish name='Simple Meal' servings=3
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should execute OTHERWISE clause (chicken=5 not > 20 or > 15)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe('Simple Meal');
    expect(meals[0].servings).toBe(3);
  });

  it('should execute SELECT statement without OTHERWISE when no WHEN matches', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=chicken
      ADDRESS kitchen
      SELECT
        WHEN stock.quantity > 10 THEN
          prepareDish name='Big Meal' servings=8
        WHEN stock.quantity > 20 THEN
          prepareDish name='Huge Meal' servings=15
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // No WHEN clause should match, no OTHERWISE - so no meals created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(0);
  });

  it('should execute first matching WHEN clause only (no fall-through)', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=chicken
      ADDRESS kitchen
      SELECT
        WHEN stock.quantity >= 3 THEN
          prepareDish name='First Match' servings=1
        WHEN stock.quantity >= 5 THEN
          prepareDish name='Second Match' servings=2
        WHEN stock.quantity >= 1 THEN
          prepareDish name='Third Match' servings=3
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should only execute first matching WHEN (chicken=5 >= 3)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe('First Match');
    expect(meals[0].servings).toBe(1);
  });

  it('should execute SELECT statement with multiple commands in WHEN clause', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=rice
      ADDRESS kitchen
      SELECT
        WHEN stock.quantity >= 15 THEN
          createMeal rice=5 spices=true
          prepareDish name='Side Dish' servings=4
          prepareDish name='Dessert' servings=2
        OTHERWISE
          prepareDish name='Simple Meal' servings=1
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should execute all commands in the matching WHEN clause
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(3);
    expect(meals[0].ingredients.rice).toBe(5);
    expect(meals[1].name).toBe('Side Dish');
    expect(meals[2].name).toBe('Dessert');
  });

  it('should handle nested SELECT statements', async () => {
    const script = `
      ADDRESS inventory
      LET chickenStock = checkStock item=chicken
      LET riceStock = checkStock item=rice
      ADDRESS kitchen
      SELECT
        WHEN chickenStock.quantity > 3 THEN
          SELECT
            WHEN riceStock.quantity > 15 THEN
              createMeal chicken=2 rice=3
            OTHERWISE
              createMeal chicken=1
          END
        OTHERWISE
          prepareDish name='Vegetarian' servings=2
      END
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should execute outer WHEN (chicken=5>3) then inner WHEN (rice=20>15)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      chicken: 2,
      rice: 3
    });
  });

  it('should handle SELECT statement with equality conditions', async () => {
    // Set up a custom inventory item for testing
    kitchenService.getInventory().mealType = 'dinner';
    
    const script = `
      ADDRESS inventory
      LET mealInfo = checkStock item=mealType
      ADDRESS kitchen
      SELECT
        WHEN mealInfo = 'breakfast' THEN
          prepareDish name='Pancakes' servings=2
        WHEN mealInfo = 'dinner' THEN
          createMeal chicken=3 potatoes=4
        OTHERWISE
          prepareDish name='Snack' servings=1
      END
    `;
    
    // Mock the checkStock to return the string value
    const originalHandle = kitchenService.handleInventoryMethod;
    kitchenService.handleInventoryMethod = function(method, params) {
      if (method === 'checkStock' && params.item === 'mealType') {
        return 'dinner';
      }
      return originalHandle.call(this, method, params);
    };
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should match second WHEN clause (mealInfo = 'dinner')
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      chicken: 3,
      potatoes: 4
    });
    
    // Restore original handler
    kitchenService.handleInventoryMethod = originalHandle;
  });

  it('should handle SELECT statement with boolean conditions', async () => {
    const script = `
      ADDRESS inventory
      LET hasSpecialIngredients = checkStock item=hasSpecialIngredients
      ADDRESS kitchen
      SELECT
        WHEN hasSpecialIngredients THEN
          prepareDish name='Special Dish' servings=6
        OTHERWISE
          prepareDish name='Regular Dish' servings=3
      END
    `;
    
    // Mock the checkStock to return a truthy value
    const originalHandle = kitchenService.handleInventoryMethod;
    kitchenService.handleInventoryMethod = function(method, params) {
      if (method === 'checkStock' && params.item === 'hasSpecialIngredients') {
        return true;
      }
      return originalHandle.call(this, method, params);
    };
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should match first WHEN clause (boolean true)
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe('Special Dish');
    expect(meals[0].servings).toBe(6);
    
    // Restore original handler
    kitchenService.handleInventoryMethod = originalHandle;
  });

  it('should evaluate simple mathematical expressions in LET assignments', async () => {
    const script = `
      ADDRESS inventory
      LET baseStock = checkStock item=chicken
      LET portions = baseStock.quantity - 2
      ADDRESS kitchen
      createMeal chicken=portions
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate baseStock.quantity - 2 = 5 - 2 = 3
    const portions = interpreter.getVariable('portions');
    expect(portions).toBe(3);
    
    // Should create meal with 3 chicken
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients.chicken).toBe(3);
    
    // Verify inventory is depleted
    expect(kitchenService.getInventory().chicken).toBe(2); // 5 - 3
  });

  it('should evaluate complex mathematical expressions with operator precedence', async () => {
    const script = `
      LET base = 10
      LET multiplier = 3
      LET result = base + multiplier * 2
      ADDRESS kitchen
      prepareDish name='Test' servings=result
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as base + (multiplier * 2) = 10 + (3 * 2) = 10 + 6 = 16
    const result = interpreter.getVariable('result');
    expect(result).toBe(16);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(16);
  });

  it('should evaluate parenthesized mathematical expressions', async () => {
    const script = `
      LET count = 5
      LET extra = 3
      LET result = (count + extra) * 2
      ADDRESS kitchen
      prepareDish name='Calculated' servings=result
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as (5 + 3) * 2 = 8 * 2 = 16
    const result = interpreter.getVariable('result');
    expect(result).toBe(16);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(16);
  });

  it('should evaluate mathematical expressions in function parameters', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=potatoes
      ADDRESS kitchen
      createMeal potatoes=stock.quantity-2 chicken=stock.quantity/2
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // stock.quantity = 10, so potatoes=8, chicken=5
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients.potatoes).toBe(8);
    expect(meals[0].ingredients.chicken).toBe(5);
  });

  it('should evaluate complex expressions with multiple operations', async () => {
    const script = `
      LET base = 4
      LET factor = 3
      LET bonus = 2
      LET result = base * factor + bonus * 2 - 1
      ADDRESS kitchen
      prepareDish name='Complex' servings=result
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as (4 * 3) + (2 * 2) - 1 = 12 + 4 - 1 = 15
    const result = interpreter.getVariable('result');
    expect(result).toBe(15);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(15);
  });

  it('should evaluate expressions with division', async () => {
    const script = `
      LET total = 20
      LET parts = 4
      LET perPart = total / parts
      ADDRESS kitchen
      prepareDish name='Divided' servings=perPart
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as 20 / 4 = 5
    const result = interpreter.getVariable('perPart');
    expect(result).toBe(5);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(5);
  });

  it('should handle division by zero errors', async () => {
    const script = `
      LET divisor = 0
      LET result = 10 / divisor
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    
    // Should throw error for division by zero
    await expect(interpreter.run(commands)).rejects.toThrow('Division by zero');
  });

  it('should evaluate expressions using variables from inventory calls', async () => {
    const script = `
      ADDRESS inventory
      LET chickenStock = checkStock item=chicken
      LET riceStock = checkStock item=rice
      LET totalIngredients = chickenStock.quantity + riceStock.quantity
      LET averagePerMeal = totalIngredients / 5
      ADDRESS kitchen
      createMeal chicken=averagePerMeal rice=averagePerMeal*2
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // chicken=5, rice=20, total=25, average=5, chicken=5, rice=10
    const totalIngredients = interpreter.getVariable('totalIngredients');
    const averagePerMeal = interpreter.getVariable('averagePerMeal');
    expect(totalIngredients).toBe(25);
    expect(averagePerMeal).toBe(5);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].ingredients.chicken).toBe(5);
    expect(meals[0].ingredients.rice).toBe(10);
  });

  it('should handle negative numbers in expressions', async () => {
    const script = `
      LET positive = 10
      LET result = positive + -3
      ADDRESS kitchen
      prepareDish name='WithNegative' servings=result
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as 10 + (-3) = 7
    const result = interpreter.getVariable('result');
    expect(result).toBe(7);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(7);
  });

  it('should evaluate nested parentheses correctly', async () => {
    const script = `
      LET a = 2
      LET b = 3
      LET c = 4
      LET result = (a + b) * (c - 1)
      ADDRESS kitchen
      prepareDish name='Nested' servings=result
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as (2 + 3) * (4 - 1) = 5 * 3 = 15
    const result = interpreter.getVariable('result');
    expect(result).toBe(15);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(15);
  });

  it('should evaluate modulo expressions with % operator', async () => {
    const script = `
      LET dividend = 17
      LET divisor = 5
      LET remainder = dividend % divisor
      ADDRESS kitchen
      prepareDish name='Modulo' servings=remainder
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as 17 % 5 = 2
    const result = interpreter.getVariable('remainder');
    expect(result).toBe(2);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(2);
  });

  it('should evaluate power expressions with ** operator', async () => {
    const script = `
      LET base = 2
      LET exponent = 3
      LET power = base ** exponent
      ADDRESS kitchen
      prepareDish name='Power' servings=power
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as 2 ** 3 = 8
    const result = interpreter.getVariable('power');
    expect(result).toBe(8);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(8);
  });

  it('should handle complex expressions with modulo and power', async () => {
    const script = `
      LET base = 3
      LET result = (base ** 2) % 7
      ADDRESS kitchen
      prepareDish name='Complex' servings=result
    `;
    
    const commands = parse(script);
    const interpreter = new Interpreter(addressSender);
    await interpreter.run(commands);
    
    // Should evaluate as (3 ** 2) % 7 = 9 % 7 = 2
    const result = interpreter.getVariable('result');
    expect(result).toBe(2);
    
    const meals = kitchenService.getMeals();
    expect(meals[0].servings).toBe(2);
  });

  describe('String Interpolation', () => {
    it('should interpolate variables in function parameters', async () => {
      const script = `
        LET mealName = "Special Dinner"
        ADDRESS kitchen
        prepareDish name="Today's {{mealName}}" servings=4
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Today's Special Dinner");
      expect(meals[0].servings).toBe(4);
    });

    it('should interpolate multiple variables in a single string', async () => {
      const script = `
        LET firstName = "John"
        LET lastName = "Doe"
        LET message = "Welcome {{firstName}} {{lastName}}"
        ADDRESS kitchen
        prepareDish name=message servings=2
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const message = interpreter.getVariable('message');
      expect(message).toBe("Welcome John Doe");
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Welcome John Doe");
    });

    it('should handle missing variables by keeping placeholder', async () => {
      const script = `
        LET knownVar = "Known"
        LET message = "Hello {{knownVar}}, missing: {{unknownVar}}"
        ADDRESS kitchen
        prepareDish name=message servings=1
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const message = interpreter.getVariable('message');
      expect(message).toBe("Hello Known, missing: {{unknownVar}}");
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Hello Known, missing: {{unknownVar}}");
    });

    it('should interpolate complex variable paths', async () => {
      const script = `
        LET stock = checkStock item=chicken
        LET status = "Current stock: {{stock.quantity}} units"
        ADDRESS kitchen
        prepareDish name=status servings=1
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const status = interpreter.getVariable('status');
      expect(status).toBe("Current stock: 5 units");
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Current stock: 5 units");
    });

    it('should handle numeric variables in interpolation', async () => {
      const script = `
        LET count = 42
        LET temperature = 375
        LET message = "Recipe #{{count}} at {{temperature}} degrees"
        ADDRESS kitchen
        prepareDish name=message servings=count
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const message = interpreter.getVariable('message');
      expect(message).toBe("Recipe #42 at 375 degrees");
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Recipe #42 at 375 degrees");
      expect(meals[0].servings).toBe(42);
    });

    it('should handle empty interpolation placeholders', async () => {
      const script = `
        LET message = "Before {} after"
        ADDRESS kitchen
        prepareDish name=message servings=1
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const message = interpreter.getVariable('message');
      expect(message).toBe("Before {} after");
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Before {} after");
    });

    it('should interpolate within conditional statements', async () => {
      const script = `
        LET mealType = "Dinner"
        LET stock = checkStock item=chicken
        IF stock.quantity > 3 THEN
          prepareDish name="Special {{mealType}}" servings=4
        ELSE
          prepareDish name="Light {{mealType}}" servings=2
        ENDIF
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const meals = kitchenService.getMeals();
      expect(meals[0].name).toBe("Special Dinner");
      expect(meals[0].servings).toBe(4);
    });

    it('should interpolate within loop iterations', async () => {
      const script = `
        LET base = "Meal"
        DO i = 1 TO 3
          prepareDish name="{{base}} #{{i}}" servings=i
        END
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const meals = kitchenService.getMeals();
      expect(meals).toHaveLength(3);
      expect(meals[0].name).toBe("Meal #1");
      expect(meals[1].name).toBe("Meal #2");
      expect(meals[2].name).toBe("Meal #3");
      expect(meals[0].servings).toBe(1);
      expect(meals[1].servings).toBe(2);
      expect(meals[2].servings).toBe(3);
    });

    it('should handle nested interpolation scenarios', async () => {
      const script = `
        LET guest = "VIP"
        LET location = "private room"
        LET timeSlot = "evening"
        LET complexMessage = "Prepare {{guest}} meal for {{location}} during {{timeSlot}}"
        ADDRESS kitchen
        prepareDish name=complexMessage servings=1
        createMeal chicken=2 potatoes=3 note="For {{guest}} in {{location}}"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const message = interpreter.getVariable('complexMessage');
      expect(message).toBe("Prepare VIP meal for private room during evening");
      
      const meals = kitchenService.getMeals();
      expect(meals).toHaveLength(2);
      expect(meals[0].name).toBe("Prepare VIP meal for private room during evening");
      expect(meals[1].note).toBe("For VIP in private room");
    });
  });

  describe('Built-in Functions', () => {
    describe('String Functions', () => {
      it('should execute UPPER function', async () => {
        const script = `
          LET result = UPPER string="hello world"
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe("HELLO WORLD");
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("HELLO WORLD");
      });

      it('should execute LOWER function', async () => {
        const script = `
          LET result = LOWER text="HELLO WORLD"
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe("hello world");
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("hello world");
      });

      it('should execute LENGTH function', async () => {
        const script = `
          LET result = LENGTH string="Hello"
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(5);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(5);
      });

      it('should handle string functions with variables', async () => {
        const script = `
          LET text = "Mixed Case Text"
          LET upper = UPPER string=text
          LET lower = LOWER string=text
          LET len = LENGTH string=text
          ADDRESS kitchen
          prepareDish name=upper servings=len
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        expect(interpreter.getVariable('upper')).toBe("MIXED CASE TEXT");
        expect(interpreter.getVariable('lower')).toBe("mixed case text");
        expect(interpreter.getVariable('len')).toBe(15);
      });

      it('should handle string functions in expressions', async () => {
        const script = `
          LET text = "hello"
          LET result = LENGTH(string=text) + 3
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(8); // LENGTH("hello") + 3 = 5 + 3 = 8
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(8);
      });
    });

    describe('Math Functions', () => {
      it('should execute MAX function', async () => {
        const script = `
          LET result = MAX a=5 b=3 c=7 d=2
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(7);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(7);
      });

      it('should execute MIN function', async () => {
        const script = `
          LET result = MIN a=5 b=3 c=7 d=2
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(2);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(2);
      });

      it('should execute ABS function', async () => {
        const script = `
          LET result = ABS value=-42
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(42);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(42);
      });

      it('should handle math functions in complex expressions', async () => {
        const script = `
          LET val1 = 10
          LET val2 = -5
          LET val3 = 3
          LET maxVal = MAX x=val1 y=val2 z=val3
          LET absVal = ABS value=val2
          LET result = maxVal + absVal
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(15); // MAX(10, -5, 3) + ABS(-5) = 10 + 5 = 15
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(15);
      });
    });

    describe('Modern Date/Time Functions', () => {
      it('should execute DATE function with default UTC timezone', async () => {
        const script = `
          LET result = DATE
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/); // Classic REXX: "DD Mon YYYY"

        const meals = kitchenService.getMeals();
        expect(meals[0].name).toMatch(/^ {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
      });

      it('should execute DATE function with sortable format code', async () => {
        const script = `
          LET result = DATE 'S'
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;

        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);

        const result = interpreter.getVariable('result');
        expect(result).toMatch(/^\d{8}$/); // YYYYMMDD format

        const meals = kitchenService.getMeals();
        expect(meals[0].name).toMatch(/^\d{8}$/);
      });

      it('should execute TIME function with default format', async () => {
        const script = `
          LET result = TIME
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/); // HH:MM:SS format
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      });

      it('should execute NOW function with default ISO format', async () => {
        const script = `
          LET result = NOW
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      it('should execute DATE_ADD function', async () => {
        const script = `
          LET result = DATE_ADD date="2025-01-01" amount="30" unit="days"
          ADDRESS kitchen
          prepareDish name="date-test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(typeof result === 'string').toBe(true);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('date-test');
      });

      it('should execute DATE_SUB function', async () => {
        const script = `
          LET result = DATE_SUB date="2025-01-31" days=30
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe('2025-01-01'); // 30 days before 2025-01-31
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('2025-01-01');
      });

      it('should execute DATE_DIFF function', async () => {
        const script = `
          LET result = DATE_DIFF date1="2025-01-01" date2="2025-01-31" unit="days"
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(30); // 30 days difference
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(30);
      });

      it('should execute DATE_VALID function with valid date', async () => {
        const script = `
          LET result = DATE_VALID date="2025-01-01"
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(true);
      });

      it('should execute DATE_VALID function with invalid date', async () => {
        const script = `
          LET result = DATE_VALID date="invalid-date"
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(false);
      });

      it('should execute DATE_PARSE_DETAILS function', async () => {
        const script = `
          LET result = DATE_PARSE_DETAILS date="January 1, 2025"
          ADDRESS kitchen
          prepareDish name="parse-test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(typeof result === 'object').toBe(true);
        expect(result.year).toBe(2025);
        expect(result.month).toBe(1);
        expect(result.day).toBe(1);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('parse-test');
      });

      it('should handle date arithmetic with multiple units', async () => {
        const script = `
          LET result = DATE_ADD date="2025-01-01" amount="15" unit="days"
          ADDRESS kitchen
          prepareDish name="arithmetic-test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(typeof result === 'string').toBe(true);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('arithmetic-test');
      });
    });

    describe('Functions in Control Flow', () => {
      it('should use built-in functions in IF conditions', async () => {
        const script = `
          LET text = "hello"
          LET textLength = LENGTH string=text
          IF textLength > 3 THEN
            prepareDish name="Long text" servings=1
          ELSE
            prepareDish name="Short text" servings=1
          ENDIF
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("Long text");
      });

      it('should use built-in functions in DO loops', async () => {
        const script = `
          LET text = "abc"
          LET textLength = LENGTH string=text
          DO i = 1 TO textLength
            prepareDish name="Item {{i}}" servings=i
          END
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const meals = kitchenService.getMeals();
        expect(meals).toHaveLength(3);
        expect(meals[0].name).toBe("Item 1");
        expect(meals[1].name).toBe("Item 2");
        expect(meals[2].name).toBe("Item 3");
      });

      it('should use built-in functions with string interpolation', async () => {
        const script = `
          LET name = "chef"
          LET upperName = UPPER string=name
          LET date = DATE
          LET message = "Welcome {{upperName}} on {{date}}"
          ADDRESS kitchen
          prepareDish name=message servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const message = interpreter.getVariable('message');
        expect(message).toMatch(/^Welcome CHEF on  {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);

        const meals = kitchenService.getMeals();
        expect(meals[0].name).toMatch(/^Welcome CHEF on  {0,2}\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}$/);
      });
    });

    describe('Error Handling', () => {
      it('should handle non-string input in string functions', async () => {
        const script = `
          LET number = 42
          LET result = UPPER string=number
          ADDRESS kitchen
          prepareDish name=result servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe("42");
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("42");
      });

      it('should duplicate strings with COPIES function', async () => {
        const script = `
          LET pattern = "Hi!"
          LET repeated = COPIES string=pattern count=3
          ADDRESS kitchen
          prepareDish name=repeated servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const repeated = interpreter.getVariable('repeated');
        expect(repeated).toBe('Hi!Hi!Hi!');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('Hi!Hi!Hi!');
      });

      it('should handle COPIES edge cases properly', async () => {
        const script = `
          LET empty = COPIES string="test" count=0
          LET negative = COPIES string="test" count=-1
          LET single = COPIES string="A" count=1
          LET emptyString = COPIES string="" count=5
          ADDRESS kitchen
          prepareDish name="EdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const negative = interpreter.getVariable('negative');
        const single = interpreter.getVariable('single');
        const emptyString = interpreter.getVariable('emptyString');
        
        expect(empty).toBe('');
        expect(negative).toBe('');
        expect(single).toBe('A');
        expect(emptyString).toBe('');
      });

      it('should strip characters with STRIP function', async () => {
        const script = `
          LET text = "   hello world   "
          LET both = STRIP string=text option="BOTH"
          LET leading = STRIP string=text option="LEADING"
          LET trailing = STRIP string=text option="TRAILING"
          LET custom = STRIP string="xxxhelloxxx" option="BOTH" character="x"
          ADDRESS kitchen
          prepareDish name="StripTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const both = interpreter.getVariable('both');
        const leading = interpreter.getVariable('leading');
        const trailing = interpreter.getVariable('trailing');
        const custom = interpreter.getVariable('custom');
        
        expect(both).toBe('hello world');
        expect(leading).toBe('hello world   ');
        expect(trailing).toBe('   hello world');
        expect(custom).toBe('hello');
      });

      it('should handle STRIP edge cases properly', async () => {
        const script = `
          LET empty = STRIP string="" option="BOTH"
          LET noMatch = STRIP string="hello" option="BOTH" character="x"
          LET singleChar = STRIP string="a" option="BOTH" character="a"
          LET shortForm = STRIP string="...test..." option="B" character="."
          ADDRESS kitchen
          prepareDish name="StripEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const noMatch = interpreter.getVariable('noMatch');
        const singleChar = interpreter.getVariable('singleChar');
        const shortForm = interpreter.getVariable('shortForm');
        
        expect(empty).toBe('');
        expect(noMatch).toBe('hello');
        expect(singleChar).toBe('');
        expect(shortForm).toBe('test');
      });

      it('should reverse strings with REVERSE function', async () => {
        const script = `
          LET text = "hello"
          LET reversed = REVERSE string=text
          LET palindrome = "racecar"
          LET palindromeReversed = REVERSE string=palindrome
          LET withSpaces = "hello world"
          LET spacesReversed = REVERSE string=withSpaces
          ADDRESS kitchen
          prepareDish name=reversed servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const reversed = interpreter.getVariable('reversed');
        const palindromeReversed = interpreter.getVariable('palindromeReversed');
        const spacesReversed = interpreter.getVariable('spacesReversed');
        
        expect(reversed).toBe('olleh');
        expect(palindromeReversed).toBe('racecar');
        expect(spacesReversed).toBe('dlrow olleh');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('olleh');
      });

      it('should handle REVERSE edge cases properly', async () => {
        const script = `
          LET empty = REVERSE string=""
          LET single = REVERSE string="a"
          LET number = REVERSE string="12345"
          LET symbols = REVERSE string="!@#$%"
          ADDRESS kitchen
          prepareDish name="ReverseEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const single = interpreter.getVariable('single');
        const number = interpreter.getVariable('number');
        const symbols = interpreter.getVariable('symbols');
        
        expect(empty).toBe('');
        expect(single).toBe('a');
        expect(number).toBe('54321');
        expect(symbols).toBe('%$#@!');
      });

      it('should normalize whitespace with SPACE function', async () => {
        const script = `
          LET messy = "  hello    world   test  "
          LET normal = SPACE string=messy
          LET double = SPACE string=messy n=2
          LET custom = SPACE string=messy n=1 pad="-"
          LET zero = SPACE string=messy n=0
          ADDRESS kitchen
          prepareDish name=normal servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const normal = interpreter.getVariable('normal');
        const double = interpreter.getVariable('double');
        const custom = interpreter.getVariable('custom');
        const zero = interpreter.getVariable('zero');
        
        expect(normal).toBe('hello world test');
        expect(double).toBe('hello  world  test');
        expect(custom).toBe('hello-world-test');
        expect(zero).toBe('helloworldtest');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello world test');
      });

      it('should handle SPACE edge cases properly', async () => {
        const script = `
          LET empty = SPACE string=""
          LET onlySpaces = SPACE string="   "
          LET singleWord = SPACE string="hello"
          LET tabs = SPACE string="hello   world   test"
          LET negative = SPACE string="a b c" n=-1
          ADDRESS kitchen
          prepareDish name="SpaceEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const onlySpaces = interpreter.getVariable('onlySpaces');
        const singleWord = interpreter.getVariable('singleWord');
        const tabs = interpreter.getVariable('tabs');
        const negative = interpreter.getVariable('negative');
        
        expect(empty).toBe('');
        expect(onlySpaces).toBe('');
        expect(singleWord).toBe('hello');
        expect(tabs).toBe('hello world test');
        expect(negative).toBe('abc'); // negative n becomes 0, so no spaces
      });

      it('should translate characters with TRANSLATE function', async () => {
        const script = `
          LET text = "hello world"
          LET upper = TRANSLATE string=text
          LET custom = TRANSLATE string="abc" outputTable="123" inputTable="abc"
          LET partial = TRANSLATE string="hello" outputTable="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          LET cipher = TRANSLATE string="ATTACK" outputTable="NOPQRSTUVWXYZABCDEFGHIJKLM" inputTable="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
          ADDRESS kitchen
          prepareDish name=upper servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const upper = interpreter.getVariable('upper');
        const custom = interpreter.getVariable('custom');
        const partial = interpreter.getVariable('partial');
        const cipher = interpreter.getVariable('cipher');
        
        expect(upper).toBe('HELLO WORLD');
        expect(custom).toBe('123');
        expect(partial).toBe('HELLO');
        expect(cipher).toBe('NGGNPX'); // ROT13 of "ATTACK"
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('HELLO WORLD');
      });

      it('should handle TRANSLATE edge cases properly', async () => {
        const script = `
          LET empty = TRANSLATE string=""
          LET noTables = TRANSLATE string="test"
          LET mismatch = TRANSLATE string="abc" outputTable="12" inputTable="abc"
          LET unknown = TRANSLATE string="xyz" outputTable="123" inputTable="abc"
          LET mixed = TRANSLATE string="a1b2c" outputTable="xyz" inputTable="abc"
          ADDRESS kitchen
          prepareDish name="TranslateEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const noTables = interpreter.getVariable('noTables');
        const mismatch = interpreter.getVariable('mismatch');
        const unknown = interpreter.getVariable('unknown');
        const mixed = interpreter.getVariable('mixed');
        
        expect(empty).toBe('');
        expect(noTables).toBe('TEST');
        expect(mismatch).toBe('12c'); // 'c' has no corresponding output
        expect(unknown).toBe('xyz'); // No characters match input table
        expect(mixed).toBe('x1y2z'); // Only abc get translated, 12 stay the same
      });

      it('should verify character sets with VERIFY function', async () => {
        const script = `
          LET digits = "1234567890"
          LET valid1 = VERIFY string="12345" reference=digits
          LET invalid1 = VERIFY string="123a5" reference=digits
          LET match1 = VERIFY string="abc123" reference=digits option="MATCH"
          LET start1 = VERIFY string="ab123cd" reference=digits option="NOMATCH" start=3
          LET allValid = VERIFY string="999" reference=digits
          ADDRESS kitchen
          prepareDish name="VerifyTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const valid1 = interpreter.getVariable('valid1');
        const invalid1 = interpreter.getVariable('invalid1');
        const match1 = interpreter.getVariable('match1');
        const start1 = interpreter.getVariable('start1');
        const allValid = interpreter.getVariable('allValid');
        
        expect(valid1).toBe(0); // All characters are in digits set
        expect(invalid1).toBe(4); // Position of 'a' (not in digits)
        expect(match1).toBe(4); // Position of first digit '1'
        expect(start1).toBe(6); // Position of 'c' starting from position 3
        expect(allValid).toBe(0); // All characters valid
      });

      it('should handle VERIFY edge cases properly', async () => {
        const script = `
          LET empty1 = VERIFY string="" reference="abc"
          LET empty2 = VERIFY string="test" reference=""
          LET beyond = VERIFY string="abc" reference="abc" start=5
          LET short = VERIFY string="ab" reference="abc" option="M"
          LET noMatch = VERIFY string="xyz" reference="abc" option="MATCH"
          ADDRESS kitchen
          prepareDish name="VerifyEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty1 = interpreter.getVariable('empty1');
        const empty2 = interpreter.getVariable('empty2');
        const beyond = interpreter.getVariable('beyond');
        const short = interpreter.getVariable('short');
        const noMatch = interpreter.getVariable('noMatch');
        
        expect(empty1).toBe(0); // Empty string is valid
        expect(empty2).toBe(1); // First char not in empty reference
        expect(beyond).toBe(0); // Start beyond string length
        expect(short).toBe(1); // First char 'a' matches reference
        expect(noMatch).toBe(0); // No chars match reference
      });

      it('should extract words with WORD function', async () => {
        const script = `
          LET sentence = "hello world test"
          LET first = WORD string=sentence n=1
          LET second = WORD string=sentence n=2
          LET third = WORD string=sentence n=3
          LET fourth = WORD string=sentence n=4
          LET spaced = "  multiple   spaces   here  "
          LET middle = WORD string=spaced n=2
          ADDRESS kitchen
          prepareDish name=first servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const first = interpreter.getVariable('first');
        const second = interpreter.getVariable('second');
        const third = interpreter.getVariable('third');
        const fourth = interpreter.getVariable('fourth');
        const middle = interpreter.getVariable('middle');
        
        expect(first).toBe('hello');
        expect(second).toBe('world');
        expect(third).toBe('test');
        expect(fourth).toBe(''); // Out of range
        expect(middle).toBe('spaces'); // Handles multiple spaces
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello');
      });

      it('should handle WORD edge cases properly', async () => {
        const script = `
          LET empty = WORD string="" n=1
          LET zero = WORD string="test word" n=0
          LET negative = WORD string="test word" n=-1
          LET single = WORD string="onlyword" n=1
          LET singleTwo = WORD string="onlyword" n=2
          LET normal = WORD string="hello world" n=2
          ADDRESS kitchen
          prepareDish name="WordEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const zero = interpreter.getVariable('zero');
        const negative = interpreter.getVariable('negative');
        const single = interpreter.getVariable('single');
        const singleTwo = interpreter.getVariable('singleTwo');
        const normal = interpreter.getVariable('normal');
        
        expect(empty).toBe('');
        expect(zero).toBe('');
        expect(negative).toBe('');
        expect(single).toBe('onlyword');
        expect(singleTwo).toBe('');
        expect(normal).toBe('world');
      });

      it('should count words with WORDS function', async () => {
        const script = `
          LET sentence = "hello world test"
          LET count1 = WORDS string=sentence
          LET single = "onlyword"
          LET count2 = WORDS string=single
          LET spaced = "  multiple   spaces   between   words  "
          LET count3 = WORDS string=spaced
          LET long = "one two three four five six seven"
          LET count4 = WORDS string=long
          ADDRESS kitchen
          prepareDish name="WordsTest" servings=count1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const count1 = interpreter.getVariable('count1');
        const count2 = interpreter.getVariable('count2');
        const count3 = interpreter.getVariable('count3');
        const count4 = interpreter.getVariable('count4');
        
        expect(count1).toBe(3); // "hello world test"
        expect(count2).toBe(1); // "onlyword"
        expect(count3).toBe(4); // Multiple spaces handled correctly
        expect(count4).toBe(7); // Long sentence
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(3);
      });

      it('should handle WORDS edge cases properly', async () => {
        const script = `
          LET empty = WORDS string=""
          LET spaces = WORDS string="   "
          LET simple = WORDS string="hello world"
          LET mixed = WORDS string="  word1   word2    word3  "
          ADDRESS kitchen
          prepareDish name="WordsEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const spaces = interpreter.getVariable('spaces');
        const simple = interpreter.getVariable('simple');
        const mixed = interpreter.getVariable('mixed');
        
        expect(empty).toBe(0); // Empty string
        expect(spaces).toBe(0); // Only spaces
        expect(simple).toBe(2); // Simple case
        expect(mixed).toBe(3); // Mixed whitespace
      });

      it('should find word positions with WORDPOS function', async () => {
        const script = `
          LET sentence = "the quick brown fox jumps over the lazy dog"
          LET pos1 = WORDPOS phrase="brown" string=sentence
          LET pos2 = WORDPOS phrase="the" string=sentence
          LET pos3 = WORDPOS phrase="the" string=sentence start=2
          LET phrase_pos = WORDPOS phrase="lazy dog" string=sentence
          LET not_found = WORDPOS phrase="cat" string=sentence
          ADDRESS kitchen
          prepareDish name="WordposTest" servings=pos1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const pos1 = interpreter.getVariable('pos1');
        const pos2 = interpreter.getVariable('pos2');
        const pos3 = interpreter.getVariable('pos3');
        const phrase_pos = interpreter.getVariable('phrase_pos');
        const not_found = interpreter.getVariable('not_found');
        
        expect(pos1).toBe(3); // "brown" is at position 3
        expect(pos2).toBe(1); // First "the" is at position 1
        expect(pos3).toBe(7); // Second "the" is at position 7
        expect(phrase_pos).toBe(8); // "lazy dog" starts at position 8
        expect(not_found).toBe(0); // "cat" not found
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(3);
      });

      it('should handle WORDPOS edge cases properly', async () => {
        const script = `
          LET empty1 = WORDPOS phrase="" string="test"
          LET empty2 = WORDPOS phrase="test" string=""
          LET same = WORDPOS phrase="hello" string="hello"
          LET partial = WORDPOS phrase="hel" string="hello world"
          LET case_sens = WORDPOS phrase="Hello" string="hello world"
          LET start_beyond = WORDPOS phrase="test" string="hello test" start=5
          ADDRESS kitchen
          prepareDish name="WordposEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty1 = interpreter.getVariable('empty1');
        const empty2 = interpreter.getVariable('empty2');
        const same = interpreter.getVariable('same');
        const partial = interpreter.getVariable('partial');
        const case_sens = interpreter.getVariable('case_sens');
        const start_beyond = interpreter.getVariable('start_beyond');
        
        expect(empty1).toBe(0); // Empty phrase
        expect(empty2).toBe(0); // Empty string
        expect(same).toBe(1); // Exact match
        expect(partial).toBe(0); // Partial word doesn't match
        expect(case_sens).toBe(0); // Case sensitive
        expect(start_beyond).toBe(0); // Start beyond string
      });

      it('should delete words with DELWORD function', async () => {
        const script = `
          LET sentence = "the quick brown fox jumps over the lazy dog"
          LET del1 = DELWORD string=sentence start=3 length=2
          LET del2 = DELWORD string=sentence start=7
          LET del3 = DELWORD string=sentence start=1 length=1
          LET del4 = DELWORD string="one two three four five" start=2 length=3
          ADDRESS kitchen
          prepareDish name="DelwordTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const del1 = interpreter.getVariable('del1');
        const del2 = interpreter.getVariable('del2');
        const del3 = interpreter.getVariable('del3');
        const del4 = interpreter.getVariable('del4');
        
        expect(del1).toBe('the quick jumps over the lazy dog'); // Remove "brown fox"
        expect(del2).toBe('the quick brown fox jumps over'); // Remove from "the lazy dog"
        expect(del3).toBe('quick brown fox jumps over the lazy dog'); // Remove "the"
        expect(del4).toBe('one five'); // Remove "two three four"
      });

      it('should handle DELWORD edge cases properly', async () => {
        const script = `
          LET empty = DELWORD string="" start=1
          LET beyond = DELWORD string="hello world" start=5
          LET zero_length = DELWORD string="hello world test" start=2 length=0
          LET negative = DELWORD string="hello world" start=0
          LET single = DELWORD string="onlyword" start=1
          LET partial = DELWORD string="one two three" start=2 length=5
          ADDRESS kitchen
          prepareDish name="DelwordEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const beyond = interpreter.getVariable('beyond');
        const zero_length = interpreter.getVariable('zero_length');
        const negative = interpreter.getVariable('negative');
        const single = interpreter.getVariable('single');
        const partial = interpreter.getVariable('partial');
        
        expect(empty).toBe(''); // Empty string
        expect(beyond).toBe('hello world'); // Start beyond words
        expect(zero_length).toBe('hello world test'); // Zero length deletion
        expect(negative).toBe('hello world'); // Invalid start position
        expect(single).toBe(''); // Delete only word
        expect(partial).toBe('one'); // Length exceeds available words
      });

      it('should extract words with SUBWORD function', async () => {
        const script = `
          LET sentence = "the quick brown fox jumps over the lazy dog"
          LET sub1 = SUBWORD string=sentence start=3 length=2
          LET sub2 = SUBWORD string=sentence start=7
          LET sub3 = SUBWORD string=sentence start=1 length=1
          LET sub4 = SUBWORD string="one two three four five" start=2 length=3
          ADDRESS kitchen
          prepareDish name="SubwordTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const sub1 = interpreter.getVariable('sub1');
        const sub2 = interpreter.getVariable('sub2');
        const sub3 = interpreter.getVariable('sub3');
        const sub4 = interpreter.getVariable('sub4');
        
        expect(sub1).toBe('brown fox'); // Extract "brown fox"
        expect(sub2).toBe('the lazy dog'); // Extract from "the lazy dog"
        expect(sub3).toBe('the'); // Extract "the"
        expect(sub4).toBe('two three four'); // Extract "two three four"
      });

      it('should handle SUBWORD edge cases properly', async () => {
        const script = `
          LET empty = SUBWORD string="" start=1
          LET beyond = SUBWORD string="hello world" start=5
          LET zero_length = SUBWORD string="hello world test" start=2 length=0
          LET negative = SUBWORD string="hello world" start=0
          LET single = SUBWORD string="onlyword" start=1
          LET partial = SUBWORD string="one two three" start=2 length=5
          ADDRESS kitchen
          prepareDish name="SubwordEdgeTest" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const empty = interpreter.getVariable('empty');
        const beyond = interpreter.getVariable('beyond');
        const zero_length = interpreter.getVariable('zero_length');
        const negative = interpreter.getVariable('negative');
        const single = interpreter.getVariable('single');
        const partial = interpreter.getVariable('partial');
        
        expect(empty).toBe(''); // Empty string
        expect(beyond).toBe(''); // Start beyond words
        expect(zero_length).toBe(''); // Zero length extraction
        expect(negative).toBe(''); // Invalid start position
        expect(single).toBe('onlyword'); // Extract only word
        expect(partial).toBe('two three'); // Length exceeds available words
      });

      it('should handle empty parameters in math functions', async () => {
        const script = `
          LET result = MAX
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(0);
        
        // Also verify the function result is used correctly
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(0);
      });

      it('should handle non-numeric input in ABS function', async () => {
        const script = `
          LET result = ABS value="not-a-number"
          ADDRESS kitchen
          prepareDish name="Test" servings=result
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const result = interpreter.getVariable('result');
        expect(result).toBe(0);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(0);
      });
    });

    describe('JSON Functions', () => {
      it('should parse valid JSON strings', async () => {
        const script = `
          LET jsonString = '{"name": "John", "age": 30, "active": true}'
          LET parsed = JSON_PARSE string=jsonString
          ADDRESS kitchen
          prepareDish name=parsed.name servings=parsed.age
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parsed = interpreter.getVariable('parsed');
        expect(parsed).toEqual({name: "John", age: 30, active: true});
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("John");
        expect(meals[0].servings).toBe(30);
      });

      it('should throw on invalid JSON strings', async () => {
        const script = `
          LET invalidJson = '{"name": "John", age: 30'
          LET parsed = JSON_PARSE string=invalidJson
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        await expect(interpreter.run(commands)).rejects.toThrow('Invalid JSON');
      });

      it('should stringify objects to JSON', async () => {
        const script = `
          LET stock = checkStock item=chicken
          LET jsonString = JSON_STRINGIFY object=stock
          ADDRESS kitchen
          prepareDish name=jsonString servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const jsonString = interpreter.getVariable('jsonString');
        expect(jsonString).toBe('{"item":"chicken","quantity":5}');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('{"item":"chicken","quantity":5}');
      });

      it('should stringify objects with indentation', async () => {
        const script = `
          LET stock = checkStock item=chicken
          LET prettyJson = JSON_STRINGIFY object=stock indent=2
          ADDRESS kitchen
          prepareDish name="formatted" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const prettyJson = interpreter.getVariable('prettyJson');
        expect(prettyJson).toBe('{\n  "item": "chicken",\n  "quantity": 5\n}');
      });

      it('should throw on objects that cannot be stringified', async () => {
        const script = `
          LET result = JSON_STRINGIFY object=obj
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        // Set up a circular reference manually
        const obj = {name: "test"};
        obj.self = obj; // Create circular reference
        interpreter.variables.set('obj', obj);
        
        await expect(interpreter.run(commands)).rejects.toThrow('Cannot stringify object');
      });

      it('should validate JSON strings', async () => {
        const script = `
          LET validJson = '{"name": "John", "age": 30}'
          LET invalidJson = '{"name": John, "age": 30}'
          LET isValid = JSON_VALID string=validJson
          LET isInvalid = JSON_VALID string=invalidJson
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const isValid = interpreter.getVariable('isValid');
        const isInvalid = interpreter.getVariable('isInvalid');
        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });

      it('should work with complex nested objects', async () => {
        const script = `
          LET simpleJson = '{"name": "John", "theme": "dark"}'
          LET data = JSON_PARSE string=simpleJson
          ADDRESS kitchen
          prepareDish name="John" note="dark" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const data = interpreter.getVariable('data');
        
        expect(data).not.toBeNull();
        expect(data.name).toBe("John");
        expect(data.theme).toBe("dark");
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("John");
        expect(meals[0].note).toBe("dark");
      });

      it('should use JSON functions in string interpolation', async () => {
        const script = `
          LET data = '{"title": "Recipe", "version": 2}'
          LET parsed = JSON_PARSE string=data
          LET message = "Processing {{parsed.title}} v{{parsed.version}}"
          ADDRESS kitchen
          prepareDish name=message servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parsed = interpreter.getVariable('parsed');
        const message = interpreter.getVariable('message');
        expect(parsed.title).toBe("Recipe");
        expect(parsed.version).toBe(2);
        expect(message).toBe("Processing Recipe v2");
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("Processing Recipe v2");
      });

      it('should use JSON functions in control flow', async () => {
        const script = `
          LET configJson = '{"enabled": true, "maxItems": 5}'
          LET config = JSON_PARSE string=configJson
          LET isValidConfig = JSON_VALID string=configJson
          
          IF isValidConfig THEN
            IF config.enabled THEN
              DO i = 1 TO config.maxItems
                prepareDish name="Item {{i}}" servings=i
              END
            ELSE
              prepareDish name="Disabled" servings=0
            ENDIF
          ELSE
            prepareDish name="Invalid config" servings=0
          ENDIF
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const meals = kitchenService.getMeals();
        expect(meals).toHaveLength(5);
        expect(meals[0].name).toBe("Item 1");
        expect(meals[4].name).toBe("Item 5");
      });
    });

    describe('URL/Web Functions', () => {
      it('should parse URLs into components', async () => {
        const script = `
          LET url = "https://api.example.com:8080/users?page=2&limit=10#section1"
          LET parsed = URL_PARSE url=url
          ADDRESS kitchen
          prepareDish name="URL Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parsed = interpreter.getVariable('parsed');
        expect(parsed).not.toBeNull();
        expect(parsed.protocol).toBe('https:');
        expect(parsed.hostname).toBe('api.example.com');
        expect(parsed.port).toBe('8080');
        expect(parsed.pathname).toBe('/users');
        expect(parsed.search).toBe('?page=2&limit=10');
        expect(parsed.hash).toBe('#section1');
        expect(parsed.origin).toBe('https://api.example.com:8080');
      });

      it('should handle invalid URLs', async () => {
        const script = `
          LET invalidUrl = "not-a-valid-url"
          LET parsed = URL_PARSE url=invalidUrl
          ADDRESS kitchen
          prepareDish name="Invalid URL Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parsed = interpreter.getVariable('parsed');
        expect(parsed).toBeNull();
      });

      it('should URL encode strings', async () => {
        const script = `
          LET original = "hello world & special chars!"
          LET encoded = URL_ENCODE string=original
          ADDRESS kitchen
          prepareDish name=encoded servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const encoded = interpreter.getVariable('encoded');
        expect(encoded).toBe('hello%20world%20%26%20special%20chars!');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello%20world%20%26%20special%20chars!');
      });

      it('should URL decode strings', async () => {
        const script = `
          LET encoded = "hello%20world%20%26%20special%20chars!"
          LET decoded = URL_DECODE string=encoded
          ADDRESS kitchen
          prepareDish name=decoded servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const decoded = interpreter.getVariable('decoded');
        expect(decoded).toBe('hello world & special chars!');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello world & special chars!');
      });

      it('should Base64 encode strings', async () => {
        const script = `
          LET original = "Hello World"
          LET encoded = BASE64_ENCODE string=original
          ADDRESS kitchen
          prepareDish name=encoded servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const encoded = interpreter.getVariable('encoded');
        expect(encoded).toBe('SGVsbG8gV29ybGQ=');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('SGVsbG8gV29ybGQ=');
      });

      it('should Base64 decode strings', async () => {
        const script = `
          LET encoded = "SGVsbG8gV29ybGQ="
          LET decoded = BASE64_DECODE string=encoded
          ADDRESS kitchen
          prepareDish name=decoded servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const decoded = interpreter.getVariable('decoded');
        expect(decoded).toBe('Hello World');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('Hello World');
      });

      it('should handle empty inputs gracefully', async () => {
        const script = `
          LET emptyUrl = URL_ENCODE string=""
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const emptyUrl = interpreter.getVariable('emptyUrl');
        
        expect(emptyUrl).toBe('');
      });

      it('should use URL functions in string interpolation', async () => {
        const script = `
          LET baseUrl = "https://api.example.com"
          LET parsed = URL_PARSE url=baseUrl
          LET message = "API host is {{parsed.hostname}}"
          ADDRESS kitchen
          prepareDish name=message servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const message = interpreter.getVariable('message');
        expect(message).toBe("API host is api.example.com");
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("API host is api.example.com");
      });

      it('should use URL functions in control flow', async () => {
        const script = `
          LET url = "https://secure-api.example.com/data"
          LET parsed = URL_PARSE url=url
          
          IF parsed.protocol = "https:" THEN
            prepareDish name="Secure connection" servings=1
          ELSE
            prepareDish name="Insecure connection" servings=1
          ENDIF
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe("Secure connection");
      });

      it('should work with API authentication patterns', async () => {
        const script = `
          LET username = "admin"
          LET password = "secret123"
          LET colon = ":"
          LET credentials = username || colon || password
          LET encoded = BASE64_ENCODE string=credentials
          LET prefix = "Basic "
          LET authHeader = prefix || encoded
          ADDRESS kitchen
          prepareDish name=authHeader servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const authHeader = interpreter.getVariable('authHeader');
        expect(authHeader).toBe('Basic YWRtaW46c2VjcmV0MTIz');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('Basic YWRtaW46c2VjcmV0MTIz');
      });

      it('should work with query string building', async () => {
        const script = `
          LET baseUrl = "https://api.example.com/search"
          LET searchTerm = "hello world"
          LET encoded = URL_ENCODE string=searchTerm
          LET queryStart = "?q="
          LET queryEnd = "&limit=10"
          LET fullUrl = baseUrl || queryStart || encoded || queryEnd
          LET parsed = URL_PARSE url=fullUrl
          ADDRESS kitchen
          prepareDish name=parsed.search servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parsed = interpreter.getVariable('parsed');
        expect(parsed.search).toBe('?q=hello%20world&limit=10');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('?q=hello%20world&limit=10');
      });
    });

    describe('UUID/ID Generation Functions', () => {
      it('should generate valid UUID v4', async () => {
        const script = `
          LET id = UUID
          ADDRESS kitchen
          prepareDish name=id servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const id = interpreter.getVariable('id');
        
        // Check UUID v4 format: 8-4-4-4-12 hexadecimal digits
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe(id);
      });

      it('should generate unique UUIDs', async () => {
        const script = `
          LET id1 = UUID
          LET id2 = UUID
          LET id3 = UUID
          ADDRESS kitchen
          prepareDish name=id1 servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const id1 = interpreter.getVariable('id1');
        const id2 = interpreter.getVariable('id2');
        const id3 = interpreter.getVariable('id3');
        
        expect(id1).not.toBe(id2);
        expect(id2).not.toBe(id3);
        expect(id1).not.toBe(id3);
        
        // All should be valid UUIDs
        expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(id3).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should generate NANOID with default length', async () => {
        const script = `
          LET id = NANOID
          ADDRESS kitchen
          prepareDish name=id servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const id = interpreter.getVariable('id');
        
        expect(id).toHaveLength(21);
        expect(id).toMatch(/^[A-Za-z0-9_-]+$/); // URL-safe characters only
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe(id);
      });

      it('should generate NANOID with custom length', async () => {
        const script = `
          LET shortId = NANOID length=8
          LET longId = NANOID length=32
          ADDRESS kitchen
          prepareDish name=shortId servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const shortId = interpreter.getVariable('shortId');
        const longId = interpreter.getVariable('longId');
        
        expect(shortId).toHaveLength(8);
        expect(longId).toHaveLength(32);
        expect(shortId).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(longId).toMatch(/^[A-Za-z0-9_-]+$/);
      });

      it('should generate unique NANOIDs', async () => {
        const script = `
          LET id1 = NANOID length=12
          LET id2 = NANOID length=12
          LET id3 = NANOID length=12
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const id1 = interpreter.getVariable('id1');
        const id2 = interpreter.getVariable('id2');
        const id3 = interpreter.getVariable('id3');
        
        expect(id1).not.toBe(id2);
        expect(id2).not.toBe(id3);
        expect(id1).not.toBe(id3);
        
        expect(id1).toHaveLength(12);
        expect(id2).toHaveLength(12);
        expect(id3).toHaveLength(12);
      });

      it('should generate random hex strings', async () => {
        const script = `
          LET hex8 = RANDOM_HEX bytes=8
          LET hex16 = RANDOM_HEX bytes=16
          LET hexDefault = RANDOM_HEX
          ADDRESS kitchen
          prepareDish name=hex8 servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const hex8 = interpreter.getVariable('hex8');
        const hex16 = interpreter.getVariable('hex16');
        const hexDefault = interpreter.getVariable('hexDefault');
        
        expect(hex8).toHaveLength(16); // 8 bytes = 16 hex chars
        expect(hex16).toHaveLength(32); // 16 bytes = 32 hex chars
        expect(hexDefault).toHaveLength(32); // default 16 bytes = 32 hex chars
        
        expect(hex8).toMatch(/^[0-9a-f]+$/);
        expect(hex16).toMatch(/^[0-9a-f]+$/);
        expect(hexDefault).toMatch(/^[0-9a-f]+$/);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe(hex8);
      });

      it('should generate random integers in range', async () => {
        const script = `
          LET small = RANDOM_INT min=1 max=10
          LET large = RANDOM_INT min=100 max=200
          LET defaultRange = RANDOM_INT
          ADDRESS kitchen
          prepareDish name="Test" servings=small
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const small = interpreter.getVariable('small');
        const large = interpreter.getVariable('large');
        const defaultRange = interpreter.getVariable('defaultRange');
        
        expect(small).toBeGreaterThanOrEqual(1);
        expect(small).toBeLessThanOrEqual(10);
        expect(large).toBeGreaterThanOrEqual(100);
        expect(large).toBeLessThanOrEqual(200);
        expect(defaultRange).toBeGreaterThanOrEqual(0);
        expect(defaultRange).toBeLessThanOrEqual(100);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(small);
      });

      it('should generate random byte arrays', async () => {
        const script = `
          LET bytes8 = RANDOM_BYTES count=8
          LET bytes16 = RANDOM_BYTES count=16
          LET bytesDefault = RANDOM_BYTES
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const bytes8 = interpreter.getVariable('bytes8');
        const bytes16 = interpreter.getVariable('bytes16');
        const bytesDefault = interpreter.getVariable('bytesDefault');
        
        expect(Array.isArray(bytes8)).toBe(true);
        expect(Array.isArray(bytes16)).toBe(true);
        expect(Array.isArray(bytesDefault)).toBe(true);
        
        expect(bytes8).toHaveLength(8);
        expect(bytes16).toHaveLength(16);
        expect(bytesDefault).toHaveLength(32);
        
        // All bytes should be in range 0-255
        bytes8.forEach(byte => {
          expect(byte).toBeGreaterThanOrEqual(0);
          expect(byte).toBeLessThanOrEqual(255);
        });
        
        bytes16.forEach(byte => {
          expect(byte).toBeGreaterThanOrEqual(0);
          expect(byte).toBeLessThanOrEqual(255);
        });
      });

      it('should use ID functions in string interpolation', async () => {
        const script = `
          LET id = NANOID length=8
          LET message = "Generated ID: {{id}}"
          ADDRESS kitchen
          prepareDish name=message servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const id = interpreter.getVariable('id');
        const message = interpreter.getVariable('message');
        
        expect(message).toBe(`Generated ID: ${id}`);
        expect(id).toHaveLength(8);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe(`Generated ID: ${id}`);
      });

      it('should use ID functions in control flow', async () => {
        const script = `
          LET testNum = 7
          
          IF testNum <= 5 THEN
            prepareDish name="Low number" servings=testNum
          ELSE
            prepareDish name="High number" servings=testNum
          ENDIF
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const testNum = interpreter.getVariable('testNum');
        const meals = kitchenService.getMeals();
        
        expect(testNum).toBe(7);
        expect(meals[0].servings).toBe(7);
        expect(meals[0].name).toBe("High number");
      });

      it('should work with tracking and logging patterns', async () => {
        const script = `
          LET sessionId = UUID
          LET requestId = NANOID length=12
          LET timestamp = NOW
          LET logPrefix = "Session: "
          LET logEntry = logPrefix || sessionId
          ADDRESS kitchen
          prepareDish name="Tracking" note=logEntry servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const sessionId = interpreter.getVariable('sessionId');
        const requestId = interpreter.getVariable('requestId');
        const logEntry = interpreter.getVariable('logEntry');
        
        expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(requestId).toHaveLength(12);
        expect(logEntry).toContain(sessionId);
        expect(logEntry).toBe(`Session: ${sessionId}`);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].note).toBe(logEntry);
      });

      it('should handle edge cases gracefully', async () => {
        const script = `
          LET zeroLength = NANOID length=0
          LET negativeLength = NANOID length=-5
          LET invalidRange = RANDOM_INT min=10 max=5
          LET zeroBytes = RANDOM_HEX bytes=0
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const zeroLength = interpreter.getVariable('zeroLength');
        const negativeLength = interpreter.getVariable('negativeLength');
        const invalidRange = interpreter.getVariable('invalidRange');
        const zeroBytes = interpreter.getVariable('zeroBytes');
        
        // Should fallback to defaults for invalid inputs
        expect(zeroLength).toHaveLength(21); // default length
        expect(negativeLength).toHaveLength(21); // default length
        expect(typeof invalidRange).toBe('number'); // should still return a number
        expect(zeroBytes).toHaveLength(32); // default 16 bytes = 32 hex chars
      });
    });

    describe('Enhanced String Functions', () => {
      it('should match patterns with REGEX_MATCH', async () => {
        const script = `
          LET email = "user@example.com"
          LET pattern = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
          LET match = REGEX_MATCH string=email pattern=pattern
          ADDRESS kitchen
          prepareDish name=match servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const match = interpreter.getVariable('match');
        expect(match).toBe('user@example.com');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('user@example.com');
      });

      it('should test patterns with REGEX_TEST', async () => {
        const script = `
          LET email = "user@example.com"
          LET invalidEmail = "notanemail"
          LET pattern = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
          LET isValid = REGEX_TEST string=email pattern=pattern
          LET isInvalid = REGEX_TEST string=invalidEmail pattern=pattern
          ADDRESS kitchen
          prepareDish name="Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const isValid = interpreter.getVariable('isValid');
        const isInvalid = interpreter.getVariable('isInvalid');
        expect(isValid).toBe(true);
        expect(isInvalid).toBe(false);
      });

      it('should replace patterns with REGEX_REPLACE', async () => {
        const script = `
          LET text = "hello world hello universe"
          LET pattern = "hello"
          LET replacement = "hi"
          LET replaced = REGEX_REPLACE string=text pattern=pattern replacement=replacement
          ADDRESS kitchen
          prepareDish name=replaced servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const replaced = interpreter.getVariable('replaced');
        expect(replaced).toBe('hi world hi universe');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hi world hi universe');
      });

      it('should split strings with REGEX_SPLIT', async () => {
        const script = `
          LET text = "apple,banana;orange:grape"
          LET pattern = "[,;:]"
          LET parts = REGEX_SPLIT string=text pattern=pattern
          ADDRESS kitchen
          prepareDish name="Split Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parts = interpreter.getVariable('parts');
        expect(Array.isArray(parts)).toBe(true);
        expect(parts).toEqual(['apple', 'banana', 'orange', 'grape']);
      });

      it('should split strings with SPLIT function', async () => {
        const script = `
          LET text = "one,two,three"
          LET parts = SPLIT string=text separator=","
          LET chars = SPLIT string="hello" separator=""
          ADDRESS kitchen
          prepareDish name="Split Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const parts = interpreter.getVariable('parts');
        const chars = interpreter.getVariable('chars');
        expect(parts).toEqual(['one', 'two', 'three']);
        expect(chars).toEqual(['h', 'e', 'l', 'l', 'o']);
      });

      it('should join arrays with JOIN function', async () => {
        const script = `
          LET words = SPLIT string="hello,world,test" separator=","
          LET joined = JOIN array=words separator=" "
          LET compact = JOIN array=words separator=""
          ADDRESS kitchen
          prepareDish name=joined servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const joined = interpreter.getVariable('joined');
        const compact = interpreter.getVariable('compact');
        expect(joined).toBe('hello world test');
        expect(compact).toBe('helloworldtest');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello world test');
      });

      it('should trim whitespace with TRIM functions', async () => {
        const script = `
          LET text = "  hello world  "
          LET trimmed = TRIM string=text
          LET trimStart = TRIM_START string=text
          LET trimEnd = TRIM_END string=text
          ADDRESS kitchen
          prepareDish name=trimmed servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const trimmed = interpreter.getVariable('trimmed');
        const trimStart = interpreter.getVariable('trimStart');
        const trimEnd = interpreter.getVariable('trimEnd');
        
        expect(trimmed).toBe('hello world');
        expect(trimStart).toBe('hello world  ');
        expect(trimEnd).toBe('  hello world');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello world');
      });

      it('should extract substrings with SUBSTRING', async () => {
        const script = `
          LET text = "hello world"
          LET sub1 = SUBSTRING string=text start=0 length=5
          LET sub2 = SUBSTRING string=text start=6
          LET sub3 = SUBSTRING string=text start=2 length=3
          ADDRESS kitchen
          prepareDish name=sub1 servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const sub1 = interpreter.getVariable('sub1');
        const sub2 = interpreter.getVariable('sub2');
        const sub3 = interpreter.getVariable('sub3');
        
        expect(sub1).toBe('hello');
        expect(sub2).toBe('world');
        expect(sub3).toBe('llo');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello');
      });

      it('should find string positions with INDEXOF', async () => {
        const script = `
          LET text = "hello world hello"
          LET pos1 = INDEXOF string=text searchString="world"
          LET pos2 = INDEXOF string=text searchString="hello" fromIndex=1
          LET notFound = INDEXOF string=text searchString="xyz"
          ADDRESS kitchen
          prepareDish name="Index Test" servings=pos1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const pos1 = interpreter.getVariable('pos1');
        const pos2 = interpreter.getVariable('pos2');
        const notFound = interpreter.getVariable('notFound');
        
        expect(pos1).toBe(6);
        expect(pos2).toBe(12);
        expect(notFound).toBe(-1);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].servings).toBe(6);
      });

      it('should check string containment with INCLUDES', async () => {
        const script = `
          LET text = "hello world"
          LET hasWorld = INCLUDES string=text searchString="world"
          LET hasXyz = INCLUDES string=text searchString="xyz"
          ADDRESS kitchen
          prepareDish name="Includes Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const hasWorld = interpreter.getVariable('hasWorld');
        const hasXyz = interpreter.getVariable('hasXyz');
        
        expect(hasWorld).toBe(true);
        expect(hasXyz).toBe(false);
      });

      it('should check string prefix/suffix with STARTS_WITH and ENDS_WITH', async () => {
        const script = `
          LET text = "hello world"
          LET startsHello = STARTS_WITH string=text searchString="hello"
          LET startsWorld = STARTS_WITH string=text searchString="world"
          LET endsWorld = ENDS_WITH string=text searchString="world"
          LET endsHello = ENDS_WITH string=text searchString="hello"
          ADDRESS kitchen
          prepareDish name="Prefix/Suffix Test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const startsHello = interpreter.getVariable('startsHello');
        const startsWorld = interpreter.getVariable('startsWorld');
        const endsWorld = interpreter.getVariable('endsWorld');
        const endsHello = interpreter.getVariable('endsHello');
        
        expect(startsHello).toBe(true);
        expect(startsWorld).toBe(false);
        expect(endsWorld).toBe(true);
        expect(endsHello).toBe(false);
      });

      it('should repeat strings with REPEAT', async () => {
        const script = `
          LET text = "ha"
          LET laugh = REPEAT string=text count=3
          LET empty = REPEAT string=text count=0
          ADDRESS kitchen
          prepareDish name=laugh servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const laugh = interpreter.getVariable('laugh');
        const empty = interpreter.getVariable('empty');
        
        expect(laugh).toBe('hahaha');
        expect(empty).toBe('');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hahaha');
      });

      it('should pad strings with PAD_START and PAD_END', async () => {
        const script = `
          LET text = "42"
          LET padded = PAD_START string=text targetLength=5 padString="0"
          LET rightPad = PAD_END string=text targetLength=5 padString="*"
          LET spacePad = PAD_START string=text targetLength=4
          ADDRESS kitchen
          prepareDish name=padded servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const padded = interpreter.getVariable('padded');
        const rightPad = interpreter.getVariable('rightPad');
        const spacePad = interpreter.getVariable('spacePad');
        
        expect(padded).toBe('00042');
        expect(rightPad).toBe('42***');
        expect(spacePad).toBe('  42');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('00042');
      });

      it('should create URL-friendly slugs with SLUG', async () => {
        const script = `
          LET title = "Hello World & More!"
          LET slug = SLUG string=title
          LET complex = "  My_Amazing-Title (2024)  "
          LET complexSlug = SLUG string=complex
          ADDRESS kitchen
          prepareDish name=slug servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const slug = interpreter.getVariable('slug');
        const complexSlug = interpreter.getVariable('complexSlug');
        
        expect(slug).toBe('hello-world-more');
        expect(complexSlug).toBe('my-amazing-title-2024');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello-world-more');
      });

      it('should use enhanced string functions in control flow', async () => {
        const script = `
          LET email = "admin@example.com"
          LET pattern = "admin@.*"
          LET isAdmin = REGEX_TEST string=email pattern=pattern
          
          IF isAdmin THEN
            prepareDish name="Admin Access" servings=1
          ELSE
            prepareDish name="User Access" servings=1
          ENDIF
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const isAdmin = interpreter.getVariable('isAdmin');
        expect(isAdmin).toBe(true);
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('Admin Access');
      });

      it('should use string functions for text processing pipelines', async () => {
        const script = `
          LET rawText = "  Hello, World! This is a TEST.  "
          LET trimmed = TRIM string=rawText
          LET lower = LOWER string=trimmed
          LET cleaned = REGEX_REPLACE string=lower pattern="[,!.]" replacement=""
          LET words = SPLIT string=cleaned separator=" "
          LET joined = JOIN array=words separator="-"
          LET slug = SLUG string=joined
          ADDRESS kitchen
          prepareDish name=slug servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const slug = interpreter.getVariable('slug');
        expect(slug).toBe('hello-world-this-is-a-test');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('hello-world-this-is-a-test');
      });

      it('should handle edge cases and invalid inputs gracefully', async () => {
        const script = `
          LET invalidRegex = REGEX_MATCH string="test" pattern="["
          LET emptyString = TRIM string=""
          LET negativeRepeat = REPEAT string="hi" count=-5
          LET nonArrayJoin = JOIN array="not-an-array" separator=","
          ADDRESS kitchen
          prepareDish name="Edge Cases" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const invalidRegex = interpreter.getVariable('invalidRegex');
        const emptyString = interpreter.getVariable('emptyString');
        const negativeRepeat = interpreter.getVariable('negativeRepeat');
        const nonArrayJoin = interpreter.getVariable('nonArrayJoin');
        
        expect(invalidRegex).toBeNull();
        expect(emptyString).toBe('');
        expect(negativeRepeat).toBe('');
        expect(nonArrayJoin).toBe('not-an-array');
      });

      it('should work with string interpolation', async () => {
        const script = `
          LET name = "John Doe"
          LET slug = SLUG string=name
          LET email = LOWER string=name
          LET cleanEmail = REGEX_REPLACE string=email pattern="\\s+" replacement=""
          LET message = "User slug: {{slug}}, email base: {{cleanEmail}}"
          ADDRESS kitchen
          prepareDish name=message servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const slug = interpreter.getVariable('slug');
        const cleanEmail = interpreter.getVariable('cleanEmail');
        const message = interpreter.getVariable('message');
        
        expect(slug).toBe('john-doe');
        expect(cleanEmail).toBe('johndoe');
        expect(message).toBe('User slug: john-doe, email base: johndoe');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('User slug: john-doe, email base: johndoe');
      });
    });

    describe('Array/Collection Functions', () => {
      it('should handle basic array manipulation functions', async () => {
        const script = `
          LET numbers = "[1, 2, 3, 4, 5]"
          LET length = ARRAY_LENGTH array=numbers
          LET pushed = ARRAY_PUSH array=numbers item=6
          LET popped = ARRAY_POP array=pushed
          LET first = ARRAY_SHIFT array=numbers
          LET unshifted = ARRAY_UNSHIFT array=numbers item=0
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const length = interpreter.getVariable('length');
        const pushed = interpreter.getVariable('pushed');
        const popped = interpreter.getVariable('popped');
        const first = interpreter.getVariable('first');
        const unshifted = interpreter.getVariable('unshifted');
        
        expect(length).toBe(5);
        expect(pushed).toEqual([1, 2, 3, 4, 5, 6]);
        expect(popped).toBe(6);
        expect(first).toBe(1);
        expect(unshifted).toEqual([0, 1, 2, 3, 4, 5]);
      });

      it('should handle array slicing and concatenation', async () => {
        const script = `
          LET arr1 = "[1, 2, 3, 4, 5]"
          LET arr2 = "[\"a\", \"b\", \"c\"]"
          LET slice = ARRAY_SLICE array=arr1 start=1 end=4
          LET concatenated = ARRAY_CONCAT array1=arr1 array2=arr2
          LET reversed = ARRAY_REVERSE array=arr1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const slice = interpreter.getVariable('slice');
        const concatenated = interpreter.getVariable('concatenated');
        const reversed = interpreter.getVariable('reversed');
        
        expect(slice).toEqual([2, 3, 4]);
        expect(concatenated).toEqual([1, 2, 3, 4, 5, 'a', 'b', 'c']);
        expect(reversed).toEqual([5, 4, 3, 2, 1]);
      });

      it('should handle array sorting and searching', async () => {
        const script = `
          LET mixed = "[\"banana\", \"apple\", \"cherry\"]"
          LET numbers = "[3, 1, 4, 1, 5]"
          LET sortedAsc = ARRAY_SORT array=mixed order=asc
          LET sortedDesc = ARRAY_SORT array=numbers order=desc
          LET includesApple = ARRAY_INCLUDES array=mixed item="apple"
          LET indexOfCherry = ARRAY_INDEXOF array=mixed item="cherry"
          LET foundBanana = ARRAY_FIND array=mixed item="banana"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const sortedAsc = interpreter.getVariable('sortedAsc');
        const sortedDesc = interpreter.getVariable('sortedDesc');
        const includesApple = interpreter.getVariable('includesApple');
        const indexOfCherry = interpreter.getVariable('indexOfCherry');
        const foundBanana = interpreter.getVariable('foundBanana');
        
        expect(sortedAsc).toEqual(['apple', 'banana', 'cherry']);
        expect(sortedDesc).toEqual([5, 4, 3, 1, 1]);
        expect(includesApple).toBe(true);
        expect(indexOfCherry).toBe(2);
        expect(foundBanana).toBe('banana');
      });

      it('should handle array deduplication and flattening', async () => {
        const script = `
          LET duplicates = "[1, 2, 2, 3, 3, 3, 4]"
          LET nested = "[[1, 2], [3, 4], [5, 6]]"
          LET unique = ARRAY_UNIQUE array=duplicates
          LET flattened = ARRAY_FLATTEN array=nested depth=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const unique = interpreter.getVariable('unique');
        const flattened = interpreter.getVariable('flattened');
        
        expect(unique).toEqual([1, 2, 3, 4]);
        expect(flattened).toEqual([1, 2, 3, 4, 5, 6]);
      });

      it('should handle array mathematical operations', async () => {
        const script = `
          LET numbers = "[10, 5, 15, 3, 8]"
          LET minimum = ARRAY_MIN array=numbers
          LET maximum = ARRAY_MAX array=numbers
          LET sum = ARRAY_SUM array=numbers
          LET average = ARRAY_AVERAGE array=numbers
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const minimum = interpreter.getVariable('minimum');
        const maximum = interpreter.getVariable('maximum');
        const sum = interpreter.getVariable('sum');
        const average = interpreter.getVariable('average');
        
        expect(minimum).toBe(3);
        expect(maximum).toBe(15);
        expect(sum).toBe(41);
        expect(average).toBeCloseTo(8.2, 1);
      });

      it('should handle array functions in expressions', async () => {
        const script = `
          LET arr = "[2, 4, 6, 8]"
          LET length = ARRAY_LENGTH array=arr
          LET sum = ARRAY_SUM array=arr
          LET result = length * 3 + sum / 2
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const length = interpreter.getVariable('length');
        const sum = interpreter.getVariable('sum');
        const result = interpreter.getVariable('result');
        
        expect(length).toBe(4);
        expect(sum).toBe(20);
        expect(result).toBe(22); // 4 * 3 + 20 / 2 = 12 + 10 = 22
      });

      it('should handle array functions in control flow', async () => {
        const script = `
          LET items = "[\"apple\", \"banana\", \"cherry\"]"
          LET itemCount = ARRAY_LENGTH array=items
          
          IF itemCount > 2 THEN
            LET firstItem = ARRAY_SHIFT array=items
            ADDRESS kitchen
            prepareDish name=firstItem servings=itemCount
          ENDIF
          
          DO i = 1 TO ARRAY_LENGTH(array=items)
            LET currentItem = ARRAY_SLICE array=items start=0 end=1
            ADDRESS kitchen
            prepareDish name="Loop Item" servings=i
          END
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const itemCount = interpreter.getVariable('itemCount');
        const firstItem = interpreter.getVariable('firstItem');
        
        expect(itemCount).toBe(3);
        expect(firstItem).toBe('apple');
        
        const meals = kitchenService.getMeals();
        expect(meals.length).toBeGreaterThan(0);
        expect(meals[0].name).toBe('apple');
        expect(meals[0].servings).toBe(3);
      });

      it('should throw on invalid array JSON', async () => {
        const script = `
          LET invalidArray = "not-an-array"
          LET lengthInvalid = ARRAY_LENGTH array=invalidArray
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        await expect(interpreter.run(commands)).rejects.toThrow('Invalid array JSON');
      });

      it('should handle empty arrays correctly', async () => {
        const script = `
          LET emptyArray = "[]"
          LET lengthEmpty = ARRAY_LENGTH array=emptyArray
          LET popEmpty = ARRAY_POP array=emptyArray
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const lengthEmpty = interpreter.getVariable('lengthEmpty');
        const popEmpty = interpreter.getVariable('popEmpty');
        
        expect(lengthEmpty).toBe(0);
        expect(popEmpty).toBe(undefined);
      });

      it('should work with kitchen RPC calls', async () => {
        const script = `
          LET ingredients = "[\"potatoes\", \"chicken\", \"rice\"]"
          LET quantities = "[3, 2, 5]"
          LET totalItems = ARRAY_SUM array=quantities
          LET firstIngredient = ARRAY_SHIFT array=ingredients
          
          ADDRESS kitchen
          IF totalItems > 5 THEN
            createMeal potatoes=3 chicken=2 rice=5 note="Array-based meal"
          ENDIF
          prepareDish name="Ingredient: {{firstIngredient}}" servings=totalItems
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const totalItems = interpreter.getVariable('totalItems');
        const firstIngredient = interpreter.getVariable('firstIngredient');
        
        expect(totalItems).toBe(10);
        expect(firstIngredient).toBe('potatoes');
        
        const meals = kitchenService.getMeals();
        expect(meals.length).toBe(2);
        expect(meals[0].note).toBe('Array-based meal');
        expect(meals[1].name).toBe('Ingredient: potatoes');
        expect(meals[1].servings).toBe(10);
      });

      it('should handle array filter and map (simplified)', async () => {
        const script = `
          LET mixed = "[1, null, 2, \"\", 3, 0, 4]"
          LET filtered = ARRAY_FILTER array=mixed
          LET mapped = ARRAY_MAP array=mixed
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const filtered = interpreter.getVariable('filtered');
        const mapped = interpreter.getVariable('mapped');
        
        // Simple filter removes null, undefined, empty string
        expect(filtered).toEqual([1, 2, 3, 0, 4]);
        // Simple map is identity
        expect(mapped).toEqual([1, null, 2, '', 3, 0, 4]);
      });

      it('should handle complex array operations in loops', async () => {
        const script = `
          LET baseArray = "[1, 2, 3]"
          LET results = "[]"
          
          DO i = 1 TO 3
            LET doubled = ARRAY_MAP array=baseArray
            LET sum = ARRAY_SUM array=baseArray
            LET newResults = ARRAY_PUSH array=results item=sum
            LET results = newResults
          END
          
          LET finalSum = ARRAY_SUM array=results
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const results = interpreter.getVariable('results');
        const finalSum = interpreter.getVariable('finalSum');
        
        expect(results).toEqual([6, 6, 6]); // sum of [1,2,3] is 6, repeated 3 times
        expect(finalSum).toBe(18); // 6 + 6 + 6
      });

      it('should handle array concatenation with string interpolation', async () => {
        const script = `
          LET fruits = "[\"apple\", \"banana\"]"
          LET vegetables = "[\"carrot\", \"lettuce\"]"
          LET combined = ARRAY_CONCAT array1=fruits array2=vegetables
          LET joinedList = JOIN array=combined separator=", "
          LET message = "Shopping list: {{joinedList}}"
          
          ADDRESS kitchen
          prepareDish name=message servings=4
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const combined = interpreter.getVariable('combined');
        const joinedList = interpreter.getVariable('joinedList');
        const message = interpreter.getVariable('message');
        
        expect(combined).toEqual(['apple', 'banana', 'carrot', 'lettuce']);
        expect(joinedList).toBe('apple, banana, carrot, lettuce');
        expect(message).toBe('Shopping list: apple, banana, carrot, lettuce');
        
        const meals = kitchenService.getMeals();
        expect(meals[0].name).toBe('Shopping list: apple, banana, carrot, lettuce');
      });
    });

    describe('SAY Statement', () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      let testOutput;
      
      beforeEach(() => {
        testOutput = new TestOutputHandler();
      });

      it('should output simple text', async () => {
        const script = `SAY "Hello World"`;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Hello World')).toBe(true);
      });

      it('should output variables', async () => {
        const script = `
          LET name = "John"
          LET age = 30
          SAY name age
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('John 30')).toBe(true);
      });

      it('should handle string interpolation', async () => {
        const script = `
          LET name = "Alice"
          LET score = 95
          SAY "Student {{name}} scored {{score}} points"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Student Alice scored 95 points')).toBe(true);
      });

      it('should output mixed text and variables', async () => {
        const script = `
          LET count = 5
          SAY "Found" count "items in inventory"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Found 5 items in inventory')).toBe(true);
      });

      it('should handle complex variable paths', async () => {
        const script = `
          ADDRESS kitchen
          LET stock = checkStock item=chicken
          SAY "Current stock:" stock.quantity "units"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Current stock: 5 units')).toBe(true);
      });

      it('should work with built-in functions', async () => {
        const script = `
          LET text = "hello world"
          LET upper = UPPER string=text
          SAY "Original:" text "Uppercase:" upper
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Original: hello world Uppercase: HELLO WORLD')).toBe(true);
      });

      it('should work in control flow statements', async () => {
        const script = `
          LET count = 3
          SAY "Starting loop with" count "iterations"
          
          DO i = 1 TO count
            SAY "Iteration" i "of" count
          END
          
          SAY "Loop completed"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.getOutputCount()).toBe(5);
        expect(testOutput.getOutputAt(0)).toBe('Starting loop with 3 iterations');
        expect(testOutput.getOutputAt(1)).toBe('Iteration 1 of 3');
        expect(testOutput.getOutputAt(2)).toBe('Iteration 2 of 3');
        expect(testOutput.getOutputAt(3)).toBe('Iteration 3 of 3');
        expect(testOutput.getOutputAt(4)).toBe('Loop completed');
      });

      it('should work in conditional statements', async () => {
        const script = `
          LET temperature = 75
          
          IF temperature > 80 THEN
            SAY "It's hot! Temperature is" temperature "degrees"
          ELSE
            SAY "Pleasant temperature of" temperature "degrees"
          ENDIF
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Pleasant temperature of 75 degrees')).toBe(true);
      });

      it('should work in SELECT statements', async () => {
        const script = `
          LET grade = 85
          
          SELECT
            WHEN grade >= 90 THEN
              SAY "Excellent! Grade:" grade
            WHEN grade >= 80 THEN
              SAY "Good work! Grade:" grade
            WHEN grade >= 70 THEN
              SAY "Passing grade:" grade
            OTHERWISE
              SAY "Needs improvement. Grade:" grade
          END
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Good work! Grade: 85')).toBe(true);
      });

      it('should handle empty SAY statement', async () => {
        const script = `SAY ""`;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('')).toBe(true);
      });

      it('should handle debugging workflow', async () => {
        const script = `
          SAY "Starting meal preparation workflow"
          
          ADDRESS kitchen
          LET stock = checkStock item=chicken
          SAY "Debug: Retrieved stock info" stock.item stock.quantity
          
          IF stock.quantity >= 3 THEN
            SAY "Sufficient chicken available, creating meal"
            createMeal chicken=3 potatoes=2 rice=5
            SAY "Meal created successfully"
          ELSE
            SAY "Insufficient chicken, only" stock.quantity "available"
            prepareDish name="Vegetarian Option" servings=2
            SAY "Prepared vegetarian dish instead"
          ENDIF
          
          SAY "Workflow completed"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.getOutputCount()).toBe(5);
        expect(testOutput.getOutputAt(0)).toBe('Starting meal preparation workflow');
        expect(testOutput.getOutputAt(1)).toBe('Debug: Retrieved stock info chicken 5');
        expect(testOutput.getOutputAt(2)).toBe('Sufficient chicken available, creating meal');
        expect(testOutput.getOutputAt(3)).toBe('Meal created successfully');
        expect(testOutput.getOutputAt(4)).toBe('Workflow completed');
      });

      it('should handle single quotes without interpolation', async () => {
        const script = `
          LET name = "John"
          SAY 'Hello {name}' "vs" "Hello {{name}}"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.hasOutput('Hello {name} vs Hello John')).toBe(true);
      });

      it('should work with array functions', async () => {
        const script = `
          LET numbers = "[1, 2, 3, 4, 5]"
          LET length = ARRAY_LENGTH array=numbers
          LET sum = ARRAY_SUM array=numbers
          
          SAY "Array" numbers "has" length "elements"
          SAY "Sum of all elements:" sum
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.getOutputCount()).toBe(2);
        expect(testOutput.getOutputAt(0)).toBe('Array [1, 2, 3, 4, 5] has 5 elements');
        expect(testOutput.getOutputAt(1)).toBe('Sum of all elements: 15');
      });

      it('should evaluate built-in function calls in SAY statements', async () => {
        const script = `
          SAY LENGTH("hello")
          SAY ABS(-5) 
          SAY MAX(1, 2, 3)
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender, testOutput);
        await interpreter.run(commands);
        
        expect(testOutput.getOutputCount()).toBe(3);
        expect(testOutput.getOutputAt(0)).toBe('5');      // LENGTH("hello") should return 5
        expect(testOutput.getOutputAt(1)).toBe('5');      // ABS(-5) should return 5  
        expect(testOutput.getOutputAt(2)).toBe('3');      // MAX(1,2,3) should return 3
      });

    describe('File System Functions', () => {
      let localStorageMock;
      
      beforeEach(() => {
        // Mock localStorage for testing
        localStorageMock = {
          store: {},
          getItem(key) {
            return this.store[key] || null;
          },
          setItem(key, value) {
            this.store[key] = value;
          },
          removeItem(key) {
            delete this.store[key];
          },
          key(index) {
            const keys = Object.keys(this.store);
            return keys[index] || null;
          },
          get length() {
            return Object.keys(this.store).length;
          },
          clear() {
            this.store = {};
          }
        };
        
        global.localStorage = localStorageMock;
      });
      
      afterEach(() => {
        delete global.localStorage;

        // Clean up filesystem files created by tests (Node.js mode)
        const fs = require('fs');
        const testFiles = [
          'test.txt', 'existing.txt', 'sized.txt', 'deleteme.txt',
          'append.txt', 'new.txt', 'pattern1.txt', 'pattern2.txt', 'other.txt',
          'source.txt', 'copy.txt', 'moved.txt', 'backup.txt', 'backup.txt.bak',
          'important.txt', 'important.txt.backup', 'data.txt', 'dynamic.txt', 'local.txt',
          'app.config', 'app.config.original', 'data.json', 'config.json'
        ];
        testFiles.forEach(file => {
          try {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
            }
          } catch (e) {
            // Ignore errors
          }
        });

        // Clear the tracked files set
        const { clearTrackedFiles } = require('../src/file-functions');
        clearTrackedFiles();
      });

      it('should write and read files', async () => {
        const script = `
          LET writeResult = FILE_WRITE filename="test.txt" content="Hello World"
          LET readResult = FILE_READ filename="test.txt"
          LET content = readResult.content
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const writeResult = interpreter.getVariable('writeResult');
        const readResult = interpreter.getVariable('readResult');
        const content = interpreter.getVariable('content');

        expect(writeResult.success).toBe(true);
        expect(writeResult.bytes).toBe(11);
        
        expect(readResult.success).toBe(true);
        expect(readResult.content).toBe('Hello World');
        expect(content).toBe('Hello World');
        expect(readResult.size).toBe(11);
      });

      it('should check file existence', async () => {
        const script = `
          LET exists1 = FILE_EXISTS filename="nonexistent.txt"
          LET writeResult = FILE_WRITE filename="existing.txt" content="test"
          LET exists2 = FILE_EXISTS filename="existing.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const exists1 = interpreter.getVariable('exists1');
        const exists2 = interpreter.getVariable('exists2');
        
        expect(exists1).toBe(false);
        expect(exists2).toBe(true);
      });

      it('should get file size', async () => {
        const script = `
          LET size1 = FILE_SIZE filename="nonexistent.txt"
          LET writeResult = FILE_WRITE filename="sized.txt" content="This is a test file"
          LET size2 = FILE_SIZE filename="sized.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const size1 = interpreter.getVariable('size1');
        const size2 = interpreter.getVariable('size2');
        
        expect(size1).toBe(-1); // File not found
        expect(size2).toBe(19);  // Length of "This is a test file"
      });

      it('should delete files', async () => {
        const script = `
          LET writeResult = FILE_WRITE filename="deleteme.txt" content="temporary"
          LET exists1 = FILE_EXISTS filename="deleteme.txt"
          LET deleteResult = FILE_DELETE filename="deleteme.txt"
          LET exists2 = FILE_EXISTS filename="deleteme.txt"
          LET deleteResult2 = FILE_DELETE filename="nonexistent.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const exists1 = interpreter.getVariable('exists1');
        const deleteResult = interpreter.getVariable('deleteResult');
        const exists2 = interpreter.getVariable('exists2');
        const deleteResult2 = interpreter.getVariable('deleteResult2');
        
        expect(exists1).toBe(true);
        expect(deleteResult.success).toBe(true);
        expect(exists2).toBe(false);
        expect(deleteResult2.success).toBe(false);
      });

      it('should append to files', async () => {
        const script = `
          LET writeResult = FILE_WRITE filename="append.txt" content="Hello "
          LET appendResult = FILE_APPEND filename="append.txt" content="World!"
          LET readResult = FILE_READ filename="append.txt"
          LET appendNewResult = FILE_APPEND filename="new.txt" content="New file content"
          LET readNewResult = FILE_READ filename="new.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const readResult = interpreter.getVariable('readResult');
        const readNewResult = interpreter.getVariable('readNewResult');
        
        expect(readResult.success).toBe(true);
        expect(readResult.content).toBe('Hello World!');
        expect(readNewResult.success).toBe(true);
        expect(readNewResult.content).toBe('New file content');
      });

      it('should list files with patterns', async () => {
        const script = `
          LET write1 = FILE_WRITE filename="data.txt" content="data"
          LET write2 = FILE_WRITE filename="config.json" content="{}"
          LET write3 = FILE_WRITE filename="backup.txt" content="backup"
          
          LET allFiles = FILE_LIST
          LET txtFiles = FILE_LIST pattern="*.txt"
          LET dataFiles = FILE_LIST pattern="data"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const allFiles = interpreter.getVariable('allFiles');
        const txtFiles = interpreter.getVariable('txtFiles');
        const dataFiles = interpreter.getVariable('dataFiles');
        
        expect(allFiles).toHaveLength(3);
        expect(allFiles.map(f => f.name).sort()).toEqual(['backup.txt', 'config.json', 'data.txt']);
        
        expect(txtFiles).toHaveLength(2);
        expect(txtFiles.map(f => f.name).sort()).toEqual(['backup.txt', 'data.txt']);
        
        expect(dataFiles).toHaveLength(1);
        expect(dataFiles[0].name).toBe('data.txt');
      });

      it('should copy files', async () => {
        const script = `
          LET writeResult = FILE_WRITE filename="source.txt" content="Source content"
          LET copyResult = FILE_COPY source="source.txt" destination="copy.txt"
          LET readSource = FILE_READ filename="source.txt"
          LET readCopy = FILE_READ filename="copy.txt"
          LET copyNonexistent = FILE_COPY source="missing.txt" destination="fail.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const copyResult = interpreter.getVariable('copyResult');
        const readSource = interpreter.getVariable('readSource');
        const readCopy = interpreter.getVariable('readCopy');
        const copyNonexistent = interpreter.getVariable('copyNonexistent');
        
        expect(copyResult.success).toBe(true);
        expect(readSource.content).toBe('Source content');
        expect(readCopy.content).toBe('Source content');
        expect(copyNonexistent.success).toBe(false);
      });

      it('should move files', async () => {
        const script = `
          LET writeResult = FILE_WRITE filename="moveme.txt" content="Moving content"
          LET moveResult = FILE_MOVE source="moveme.txt" destination="moved.txt"
          LET sourceExists = FILE_EXISTS filename="moveme.txt"
          LET destExists = FILE_EXISTS filename="moved.txt"
          LET readMoved = FILE_READ filename="moved.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const moveResult = interpreter.getVariable('moveResult');
        const sourceExists = interpreter.getVariable('sourceExists');
        const destExists = interpreter.getVariable('destExists');
        const readMoved = interpreter.getVariable('readMoved');
        
        expect(moveResult.success).toBe(true);
        expect(sourceExists).toBe(false);
        expect(destExists).toBe(true);
        expect(readMoved.content).toBe('Moving content');
      });

      it('should create backups', async () => {
        const script = `
          LET writeResult = FILE_WRITE filename="important.txt" content="Important data"
          LET backupResult = FILE_BACKUP filename="important.txt"
          LET customBackup = FILE_BACKUP filename="important.txt" suffix=".backup"
          
          LET originalExists = FILE_EXISTS filename="important.txt"
          LET bakExists = FILE_EXISTS filename="important.txt.bak"
          LET customExists = FILE_EXISTS filename="important.txt.backup"
          
          LET readBak = FILE_READ filename="important.txt.bak"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const backupResult = interpreter.getVariable('backupResult');
        const originalExists = interpreter.getVariable('originalExists');
        const bakExists = interpreter.getVariable('bakExists');
        const customExists = interpreter.getVariable('customExists');
        const readBak = interpreter.getVariable('readBak');
        
        expect(backupResult.success).toBe(true);
        expect(originalExists).toBe(true);
        expect(bakExists).toBe(true);
        expect(customExists).toBe(true);
        expect(readBak.content).toBe('Important data');
      });

      it('should work with string interpolation', async () => {
        const script = `
          LET filename = "dynamic.txt"
          LET message = "Hello from Rexx"
          
          LET writeResult = FILE_WRITE filename=filename content="Content: {{message}}"
          LET readResult = FILE_READ filename=filename
          
          SAY "File {{filename}} contains: {{readResult.content}}"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const readResult = interpreter.getVariable('readResult');
        
        expect(readResult.success).toBe(true);
        expect(readResult.content).toBe('Content: Hello from Rexx');
      });

      it('should work in control flow statements', async () => {
        const script = `
          LET logFile = "process.log"
          LET counter = 0
          
          DO i = 1 TO 3
            LET counter = counter + 1
            LET logEntry = "Processing item {{i}} at step {{counter}}"
            LET appendResult = FILE_APPEND filename=logFile content=logEntry
            
            IF i = 2 THEN
              LET backupResult = FILE_BACKUP filename=logFile suffix=".checkpoint"
            ENDIF
          END
          
          LET finalLog = FILE_READ filename=logFile
          LET checkpointExists = FILE_EXISTS filename="process.log.checkpoint"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const finalLog = interpreter.getVariable('finalLog');
        const checkpointExists = interpreter.getVariable('checkpointExists');
        
        expect(finalLog.success).toBe(true);
        expect(finalLog.content).toContain('Processing item 1');
        expect(finalLog.content).toContain('Processing item 2');
        expect(finalLog.content).toContain('Processing item 3');
        expect(checkpointExists).toBe(true);
      });

      it('should handle workflow automation scenarios', async () => {
        const script = `
          LET configFile = "app.config"
          LET dataFile = "data.json"
          
          SAY "Initializing configuration system"
          LET config = "debug=true\\nversion=1.0\\nmode=production"
          LET writeConfig = FILE_WRITE filename=configFile content=config
          
          SAY "Creating sample data"
          LET sampleData = "{\\"users\\": [], \\"settings\\": {}}"
          LET writeData = FILE_WRITE filename=dataFile content=sampleData
          
          SAY "Backing up configuration"
          LET backupResult = FILE_BACKUP filename=configFile suffix=".original"
          
          SAY "Updating configuration"
          LET newConfig = "debug=false\\nversion=1.1\\nmode=production"
          LET updateConfig = FILE_WRITE filename=configFile content=newConfig
          
          LET allFiles = FILE_LIST
          LET configCount = ARRAY_LENGTH array=allFiles
          
          SAY "Configuration system ready with {{configCount}} files"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const allFiles = interpreter.getVariable('allFiles');
        const configCount = interpreter.getVariable('configCount');
        
        expect(configCount).toBe(3); // app.config, data.json, app.config.original
        expect(allFiles.map(f => f.name).sort()).toEqual(['app.config', 'app.config.original', 'data.json']);
        
        // Verify the original backup was created
        const originalExists = await interpreter.executeFunctionCall({
          command: 'FILE_EXISTS',
          params: { filename: 'app.config.original' }
        });
        expect(originalExists).toBe(true);
      });

      it('should handle error cases gracefully', async () => {
        const script = `
          LET readNonexistent = FILE_READ filename="missing.txt"
          LET sizeNonexistent = FILE_SIZE filename="missing.txt"
          LET deleteNonexistent = FILE_DELETE filename="missing.txt"
          LET copyNonexistent = FILE_COPY source="missing.txt" destination="fail.txt"
          LET moveNonexistent = FILE_MOVE source="missing.txt" destination="fail.txt"
          LET backupNonexistent = FILE_BACKUP filename="missing.txt"
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const readNonexistent = interpreter.getVariable('readNonexistent');
        const sizeNonexistent = interpreter.getVariable('sizeNonexistent');
        const deleteNonexistent = interpreter.getVariable('deleteNonexistent');
        const copyNonexistent = interpreter.getVariable('copyNonexistent');
        const moveNonexistent = interpreter.getVariable('moveNonexistent');
        const backupNonexistent = interpreter.getVariable('backupNonexistent');
        
        expect(readNonexistent.success).toBe(false);
        expect(sizeNonexistent).toBe(-1);
        expect(deleteNonexistent.success).toBe(false);
        expect(copyNonexistent.success).toBe(false);
        expect(moveNonexistent.success).toBe(false);
        expect(backupNonexistent.success).toBe(false);
      });

      // HTTP-based file operations tests
      describe('HTTP File Operations', () => {
        // Mock fetch for HTTP tests
        const originalFetch = global.fetch;
        
        beforeEach(() => {
          global.fetch = jest.fn();
        });
        
        afterEach(() => {
          global.fetch = originalFetch;
        });

        it('should read HTTP files via GET request', async () => {
          const mockCsvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
          
          global.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockCsvData),
            url: '/data/users.csv',
            headers: {
              get: (header) => header === 'content-type' ? 'text/csv' : null
            }
          });

          const script = `
            LET csvData = FILE_READ filename="/data/users.csv"
          `;
          
          const commands = parse(script);
          const interpreter = new Interpreter(addressSender);
          await interpreter.run(commands);
          
          const csvData = interpreter.getVariable('csvData');
          
          expect(csvData.success).toBe(true);
          expect(csvData.content).toBe(mockCsvData);
          expect(csvData.size).toBe(mockCsvData.length);
          expect(csvData.contentType).toBe('text/csv');
          expect(global.fetch).toHaveBeenCalledWith('/data/users.csv');
        });

        it('should handle relative path HTTP files', async () => {
          const mockConfigData = '{"debug": true, "version": "1.0"}';
          
          global.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve(mockConfigData),
            url: './config/settings.json',
            headers: {
              get: (header) => header === 'content-type' ? 'application/json' : null
            }
          });

          const script = `
            LET configData = FILE_READ filename="./config/settings.json"
          `;
          
          const commands = parse(script);
          const interpreter = new Interpreter(addressSender);
          await interpreter.run(commands);
          
          const configData = interpreter.getVariable('configData');
          
          expect(configData.success).toBe(true);
          expect(configData.content).toBe(mockConfigData);
          expect(global.fetch).toHaveBeenCalledWith('./config/settings.json');
        });

        it('should handle HTTP file not found errors', async () => {
          global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: 'Not Found'
          });

          const script = `
            LET missingFile = FILE_READ filename="/data/missing.csv"
          `;
          
          const commands = parse(script);
          const interpreter = new Interpreter(addressSender);
          await interpreter.run(commands);
          
          const missingFile = interpreter.getVariable('missingFile');
          
          expect(missingFile.success).toBe(false);
          expect(missingFile.error).toContain('HTTP 404');
          expect(global.fetch).toHaveBeenCalledWith('/data/missing.csv');
        });

        it('should check HTTP file existence with HEAD request', async () => {
          // Mock successful HEAD request
          global.fetch.mockResolvedValueOnce({
            ok: true
          });

          // Mock failed HEAD request  
          global.fetch.mockResolvedValueOnce({
            ok: false
          });

          const script = `
            LET existsTrue = FILE_EXISTS filename="/api/data.json"
            LET existsFalse = FILE_EXISTS filename="/api/missing.json"
          `;
          
          const commands = parse(script);
          const interpreter = new Interpreter(addressSender);
          await interpreter.run(commands);
          
          const existsTrue = interpreter.getVariable('existsTrue');
          const existsFalse = interpreter.getVariable('existsFalse');
          
          expect(existsTrue).toBe(true);
          expect(existsFalse).toBe(false);
          expect(global.fetch).toHaveBeenCalledWith('/api/data.json', { method: 'HEAD' });
          expect(global.fetch).toHaveBeenCalledWith('/api/missing.json', { method: 'HEAD' });
        });

        it('should prevent FILE_WRITE to HTTP paths', async () => {
          const script = `
            LET writeHttp = FILE_WRITE filename="/data/output.csv" content="test,data"
            LET writeRelative = FILE_WRITE filename="./config/new.json" content="{}"
            LET writeUrl = FILE_WRITE filename="https://example.com/api/upload" content="data"
          `;
          
          const commands = parse(script);
          const interpreter = new Interpreter(addressSender);
          await interpreter.run(commands);
          
          const writeHttp = interpreter.getVariable('writeHttp');
          const writeRelative = interpreter.getVariable('writeRelative');
          const writeUrl = interpreter.getVariable('writeUrl');
          
          expect(writeHttp.success).toBe(false);
          expect(writeHttp.error).toContain('FILE_WRITE not supported for HTTP resources');
          expect(writeRelative.success).toBe(false);
          expect(writeUrl.success).toBe(false);
        });

        it('should route between localStorage and HTTP based on filename patterns', async () => {
          // Mock HTTP file
          global.fetch.mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve('HTTP content'),
            url: '/data/remote.txt',
            headers: { get: () => null }
          });

          const script = `
            -- localStorage file (no path separators)
            LET writeLocal = FILE_WRITE filename="local.txt" content="Local content"
            LET readLocal = FILE_READ filename="local.txt"
            
            -- HTTP file (with path separators)  
            LET readHttp = FILE_READ filename="/data/remote.txt"
            
            -- localStorage existence check
            LET existsLocal = FILE_EXISTS filename="local.txt"
          `;
          
          const commands = parse(script);
          const interpreter = new Interpreter(addressSender);
          await interpreter.run(commands);
          
          const writeLocal = interpreter.getVariable('writeLocal');
          const readLocal = interpreter.getVariable('readLocal');
          const readHttp = interpreter.getVariable('readHttp');
          const existsLocal = interpreter.getVariable('existsLocal');
          
          // localStorage operations
          expect(writeLocal.success).toBe(true);
          expect(readLocal.success).toBe(true);
          expect(readLocal.content).toBe('Local content');
          expect(existsLocal).toBe(true);
          
          // HTTP operations
          expect(readHttp.success).toBe(true);
          expect(readHttp.content).toBe('HTTP content');
          expect(global.fetch).toHaveBeenCalledWith('/data/remote.txt');
        });
      });
    });
    
    describe('Reflection Functions', () => {
      it('should execute SUBROUTINES function with no pattern', async () => {
        const script = `
          LET allSubs = SUBROUTINES()
          ADDRESS kitchen
          prepareDish name="test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        // First define some subroutines
        await interpreter.run(parse(`
          TestSub1:
            RETURN "test1"
          TestSub2:
            RETURN "test2"
        `));
        
        // Then run the test script
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('allSubs');
        expect(Array.isArray(result)).toBe(true);
        expect(result).toContain('TESTSUB1');
        expect(result).toContain('TESTSUB2');
      });

      it('should execute SUBROUTINES function with pattern filtering', async () => {
        const script = `
          LET testSubs = SUBROUTINES("test")
          LET helperSubs = SUBROUTINES("helper")
          ADDRESS kitchen
          prepareDish name="test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        // Define mixed subroutines
        await interpreter.run(parse(`
          TestRoutine:
            RETURN "test"
          HelperRoutine:
            RETURN "helper"
          ValidatorRoutine:
            RETURN "validator"
          TestHelper:
            RETURN "both"
        `));
        
        await interpreter.run(parse(script));
        
        const testResult = interpreter.getVariable('testSubs');
        const helperResult = interpreter.getVariable('helperSubs');
        
        expect(Array.isArray(testResult)).toBe(true);
        expect(Array.isArray(helperResult)).toBe(true);
        
        expect(testResult).toContain('TESTROUTINE');
        expect(testResult).toContain('TESTHELPER');
        expect(testResult).not.toContain('VALIDATORROUTINE');
        
        expect(helperResult).toContain('HELPERROUTINE');
        expect(helperResult).toContain('TESTHELPER');
        expect(helperResult).not.toContain('TESTROUTINE');
      });

      it('should handle edge cases in SUBROUTINES function', async () => {
        const interpreter = new Interpreter(addressSender);
        
        // First define some subroutines
        await interpreter.run(parse(`
          MySub123:
            RETURN "numeric"
          MySub:
            RETURN "regular"
        `));
        
        // Then run the test script to call SUBROUTINES
        const script = `
          LET emptyPattern = SUBROUTINES("")
          LET nonexistentPattern = SUBROUTINES("xyz")  
          LET numericPattern = SUBROUTINES("123")
          ADDRESS kitchen
          prepareDish name="test" servings=1
        `;
        
        await interpreter.run(parse(script));
        
        const emptyResult = interpreter.getVariable('emptyPattern');
        const nonexistentResult = interpreter.getVariable('nonexistentPattern');
        const numericResult = interpreter.getVariable('numericPattern');
        
        expect(Array.isArray(emptyResult)).toBe(true);
        expect(emptyResult).toContain('MYSUB123');
        expect(emptyResult).toContain('MYSUB');
        
        expect(Array.isArray(nonexistentResult)).toBe(true);
        expect(nonexistentResult).toHaveLength(0);
        
        expect(Array.isArray(numericResult)).toBe(true);
        expect(numericResult).toContain('MYSUB123');
        expect(numericResult).not.toContain('MYSUB');
      });

      it('should return empty array when no subroutines exist', async () => {
        const script = `
          LET noSubs = SUBROUTINES()
          LET noSubsPattern = SUBROUTINES("test")
          ADDRESS kitchen
          prepareDish name="test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        await interpreter.run(commands);
        
        const noSubs = interpreter.getVariable('noSubs');
        const noSubsPattern = interpreter.getVariable('noSubsPattern');
        
        expect(Array.isArray(noSubs)).toBe(true);
        expect(noSubs).toHaveLength(0);
        expect(Array.isArray(noSubsPattern)).toBe(true);
        expect(noSubsPattern).toHaveLength(0);
      });

      it('should handle case insensitive pattern matching', async () => {
        const script = `
          LET lowerPattern = SUBROUTINES("helper")
          LET upperPattern = SUBROUTINES("HELPER")
          LET mixedPattern = SUBROUTINES("Helper")
          ADDRESS kitchen
          prepareDish name="test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        await interpreter.run(parse(`
          HelperRoutine:
            RETURN "helper"
          UPPER_HELPER:
            RETURN "upper"
          mixed_Helper_routine:
            RETURN "mixed"
        `));
        
        await interpreter.run(parse(script));
        
        const lowerResult = interpreter.getVariable('lowerPattern');
        const upperResult = interpreter.getVariable('upperPattern');
        const mixedResult = interpreter.getVariable('mixedPattern');
        
        // All should return the same results due to case insensitive matching
        expect(lowerResult).toEqual(upperResult);
        expect(upperResult).toEqual(mixedResult);
        
        expect(lowerResult).toContain('HELPERROUTINE');
        expect(lowerResult).toContain('UPPER_HELPER');
        expect(lowerResult).toContain('MIXED_HELPER_ROUTINE');
      });

      it('should trim whitespace from subroutine names', async () => {
        const script = `
          LET allSubs = SUBROUTINES()
          ADDRESS kitchen
          prepareDish name="test" servings=1
        `;
        
        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);
        
        // Manually add subroutines with whitespace (simulating edge case)
        interpreter.subroutines.set('  WhitespaceSub  ', { commands: [], parameters: [] });
        interpreter.subroutines.set('NormalSub', { commands: [], parameters: [] });
        interpreter.subroutines.set('', { commands: [], parameters: [] }); // Empty name
        interpreter.subroutines.set('   ', { commands: [], parameters: [] }); // Only whitespace
        
        await interpreter.run(parse(script));
        
        const result = interpreter.getVariable('allSubs');
        
        expect(Array.isArray(result)).toBe(true);
        expect(result).toContain('WHITESPACESUB'); // Should be trimmed and uppercased
        expect(result).toContain('NORMALSUB');
        expect(result).not.toContain('  WHITESPACESUB  '); // No untrimmed version
        expect(result).not.toContain(''); // Empty names filtered out
        expect(result.every(name => name.trim() === name)).toBe(true); // All trimmed
      });

      it('should return an array of strings', async () => {
        const script = `
          LET subs = SUBROUTINES()
        `;

        const commands = parse(script);
        const interpreter = new Interpreter(addressSender);

        await interpreter.run(parse(`
          MySub:
            RETURN "test"
        `));

        await interpreter.run(parse(script));

        const result = interpreter.getVariable('subs');
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(typeof result[0]).toBe('string');
        }
      });

      it('should support regex pattern matching with SUBROUTINES', async () => {
        const interpreter = new Interpreter(addressSender);
        
        // Define test subroutines with different naming patterns
        await interpreter.run(parse(`
          StringLengthTest:
            RETURN "string length test"
          StringCaseTest:
            RETURN "string case test"
          EdgeCaseTest:
            RETURN "edge case test"
          HelperFunction:
            RETURN "helper function"
          ValidateInput:
            RETURN "validate input"
          ProcessDataTest:
            RETURN "process data test"
        `));
        
        const script = `
          LET testSubs = SUBROUTINES(".*Test$")
          LET functionSubs = SUBROUTINES(".*Function$")
          LET allSubs = SUBROUTINES()
          LET noMatch = SUBROUTINES(".*XYZ$")
        `;
        
        await interpreter.run(parse(script));
        
        const testResult = interpreter.getVariable('testSubs');
        const functionResult = interpreter.getVariable('functionSubs');
        const allResult = interpreter.getVariable('allSubs');
        const noMatchResult = interpreter.getVariable('noMatch');
        
        // Test regex pattern .*Test$ should match subroutines ending with "Test"
        expect(Array.isArray(testResult)).toBe(true);
        expect(testResult).toContain('STRINGLENGTHTEST');
        expect(testResult).toContain('STRINGCASETEST');
        expect(testResult).toContain('EDGECASETEST');
        expect(testResult).toContain('PROCESSDATATEST');
        expect(testResult).not.toContain('HELPERFUNCTION');
        expect(testResult).not.toContain('VALIDATEINPUT');
        
        // Test regex pattern .*Function$ should match subroutines ending with "Function"
        expect(Array.isArray(functionResult)).toBe(true);
        expect(functionResult).toContain('HELPERFUNCTION');
        expect(functionResult).not.toContain('STRINGLENGTHTEST');
        expect(functionResult).not.toContain('VALIDATEINPUT');
        
        // Test all subroutines
        expect(Array.isArray(allResult)).toBe(true);
        expect(allResult.length).toBeGreaterThan(4);
        
        // Test no matches
        expect(Array.isArray(noMatchResult)).toBe(true);
        expect(noMatchResult.length).toBe(0);
      });

      it('should handle complex regex patterns in SUBROUTINES', async () => {
        const interpreter = new Interpreter(addressSender);
        
        await interpreter.run(parse(`
          TestSetup:
            RETURN "test setup"
          TestCleanup:
            RETURN "test cleanup"
          TestValidation:
            RETURN "test validation"
          SetupHelper:
            RETURN "setup helper"
          CleanupUtil:
            RETURN "cleanup util"
          ValidationTest:
            RETURN "validation test"
        `));
        
        const script = `
          LET testPrefix = SUBROUTINES("^Test.*")
          LET testSuffix = SUBROUTINES(".*Test$")
          LET setupPattern = SUBROUTINES(".*Setup.*")
          LET validationPattern = SUBROUTINES(".*[Vv]alidation.*")
        `;
        
        await interpreter.run(parse(script));
        
        const testPrefixResult = interpreter.getVariable('testPrefix');
        const testSuffixResult = interpreter.getVariable('testSuffix');
        const setupResult = interpreter.getVariable('setupPattern');
        const validationResult = interpreter.getVariable('validationPattern');
        
        // Test ^Test.* pattern (starts with Test)
        expect(testPrefixResult).toContain('TESTSETUP');
        expect(testPrefixResult).toContain('TESTCLEANUP');
        expect(testPrefixResult).toContain('TESTVALIDATION');
        expect(testPrefixResult).not.toContain('SETUPHELPER');
        expect(testPrefixResult).not.toContain('VALIDATIONTEST');
        
        // Test .*Test$ pattern (ends with Test)
        expect(testSuffixResult).toContain('VALIDATIONTEST');
        expect(testSuffixResult).not.toContain('TESTSETUP');
        expect(testSuffixResult).not.toContain('SETUPHELPER');
        
        // Test .*Setup.* pattern (contains Setup)
        expect(setupResult).toContain('TESTSETUP');
        expect(setupResult).toContain('SETUPHELPER');
        expect(setupResult).not.toContain('TESTCLEANUP');
        
        // Test case insensitive validation pattern
        expect(validationResult).toContain('TESTVALIDATION');
        expect(validationResult).toContain('VALIDATIONTEST');
      });
    });
    });
  });
  
  describe('Validation Functions', () => {
    it('should validate email addresses', async () => {
      const script = `
        LET validEmail = IS_EMAIL email="test@example.com"
        LET invalidEmail = IS_EMAIL email="invalid-email"
        LET emptyEmail = IS_EMAIL email=""
        LET complexEmail = IS_EMAIL email="user+tag@subdomain.example.co.uk"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('validEmail')).toBe(true);
      expect(interpreter.getVariable('invalidEmail')).toBe(false);
      expect(interpreter.getVariable('emptyEmail')).toBe(false);
      expect(interpreter.getVariable('complexEmail')).toBe(true);
    });

    it('should validate URLs', async () => {
      const script = `
        LET httpUrl = IS_URL url="http://example.com"
        LET httpsUrl = IS_URL url="https://www.example.com/path?param=value"
        LET ftpUrl = IS_URL url="ftp://ftp.example.com/file.txt"
        LET invalidUrl = IS_URL url="not-a-url"
        LET emptyUrl = IS_URL url=""
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('httpUrl')).toBe(true);
      expect(interpreter.getVariable('httpsUrl')).toBe(true);
      expect(interpreter.getVariable('ftpUrl')).toBe(true);
      expect(interpreter.getVariable('invalidUrl')).toBe(false);
      expect(interpreter.getVariable('emptyUrl')).toBe(false);
    });

    it('should validate phone numbers', async () => {
      const script = `
        LET usPhone = IS_PHONE phone="555-123-4567"
        LET intlPhone = IS_PHONE phone="+1-555-123-4567"
        LET digitsOnly = IS_PHONE phone="5551234567"
        LET invalidPhone = IS_PHONE phone="123"
        LET usFormatted = IS_PHONE phone="555-123-4567" format="US"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('usPhone')).toBe(true);
      expect(interpreter.getVariable('intlPhone')).toBe(true);
      expect(interpreter.getVariable('digitsOnly')).toBe(true);
      expect(interpreter.getVariable('invalidPhone')).toBe(false);
      expect(interpreter.getVariable('usFormatted')).toBe(true);
    });

    it('should validate worldwide phone numbers', async () => {
      const script = `
        LET ukPhone = IS_PHONE phone="+44 20 1234 5678" format="UK"
        LET australianPhone = IS_PHONE phone="+61 2 1234 5678" format="AU" 
        LET germanPhone = IS_PHONE phone="+49 30 12345678" format="DE"
        LET frenchPhone = IS_PHONE phone="+33 1 23 45 67 89" format="FR"
        LET indiaPhone = IS_PHONE phone="+91 98765 43210" format="IN"
        LET japanPhone = IS_PHONE phone="+81 90 1234 5678" format="JP"
        LET chinaPhone = IS_PHONE phone="+86 138 0013 8000" format="CN"
        LET brazilPhone = IS_PHONE phone="+55 11 98765-4321" format="BR"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('ukPhone')).toBe(true);
      expect(interpreter.getVariable('australianPhone')).toBe(true);
      expect(interpreter.getVariable('germanPhone')).toBe(true);
      expect(interpreter.getVariable('frenchPhone')).toBe(true);
      expect(interpreter.getVariable('indiaPhone')).toBe(true);
      expect(interpreter.getVariable('japanPhone')).toBe(true);
      expect(interpreter.getVariable('chinaPhone')).toBe(true);
      expect(interpreter.getVariable('brazilPhone')).toBe(true);
    });

    it('should validate numbers and ranges', async () => {
      const script = `
        LET isInt = IS_NUMBER value="42"
        LET isFloat = IS_NUMBER value="3.14"
        LET notNumber = IS_NUMBER value="abc"
        LET inRange = IS_NUMBER value="5" min="1" max="10"
        LET outOfRange = IS_NUMBER value="15" min="1" max="10"
        LET negativeNumber = IS_NUMBER value="-5"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('isInt')).toBe(true);
      expect(interpreter.getVariable('isFloat')).toBe(true);
      expect(interpreter.getVariable('notNumber')).toBe(false);
      expect(interpreter.getVariable('inRange')).toBe(true);
      expect(interpreter.getVariable('outOfRange')).toBe(false);
      expect(interpreter.getVariable('negativeNumber')).toBe(true);
    });

    it('should validate dates and times', async () => {
      const script = `
        LET validDate = IS_DATE date="2024-01-15"
        LET validDateTime = IS_DATE date="2024-01-15T10:30:00"
        LET invalidDate = IS_DATE date="2024-13-45"
        LET validTime = IS_TIME time="14:30:00"
        LET invalidTime = IS_TIME time="25:70:90"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('validDate')).toBe(true);
      expect(interpreter.getVariable('validDateTime')).toBe(true);
      expect(interpreter.getVariable('invalidDate')).toBe(false);
      expect(interpreter.getVariable('validTime')).toBe(true);
      expect(interpreter.getVariable('invalidTime')).toBe(false);
    });

    it('should validate credit cards using Luhn algorithm', async () => {
      const script = `
        LET validVisa = IS_CREDIT_CARD cardNumber="4532015112830366"
        LET validMaster = IS_CREDIT_CARD cardNumber="5555555555554444"
        LET invalidCard = IS_CREDIT_CARD cardNumber="1234567890123456"
        LET spacedCard = IS_CREDIT_CARD cardNumber="4532 0151 1283 0366"
        LET dashedCard = IS_CREDIT_CARD cardNumber="4532-0151-1283-0366"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('validVisa')).toBe(true);
      expect(interpreter.getVariable('validMaster')).toBe(true);
      expect(interpreter.getVariable('invalidCard')).toBe(false);
      expect(interpreter.getVariable('spacedCard')).toBe(true);
      expect(interpreter.getVariable('dashedCard')).toBe(true);
    });

    it('should validate postal codes for different countries', async () => {
      const script = `
        LET usZip = IS_POSTAL_CODE code="12345" country="US"
        LET usZipPlus4 = IS_POSTAL_CODE code="12345-6789" country="US"
        LET ukPostcode = IS_POSTAL_CODE code="SW1A 1AA" country="UK"
        LET caPostal = IS_POSTAL_CODE code="K1A 0A6" country="CA"
        LET invalidUs = IS_POSTAL_CODE code="1234" country="US"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('usZip')).toBe(true);
      expect(interpreter.getVariable('usZipPlus4')).toBe(true);
      expect(interpreter.getVariable('ukPostcode')).toBe(true);
      expect(interpreter.getVariable('caPostal')).toBe(true);
      expect(interpreter.getVariable('invalidUs')).toBe(false);
    });

    it('should validate IP addresses', async () => {
      const script = `
        LET ipv4Valid = IS_IP ip="192.168.1.1"
        LET ipv4Invalid = IS_IP ip="256.256.256.256"
        LET ipv6Valid = IS_IP ip="2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        LET ipv6Short = IS_IP ip="2001:db8::1"
        LET notIp = IS_IP ip="hello world"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('ipv4Valid')).toBe(true);
      expect(interpreter.getVariable('ipv4Invalid')).toBe(false);
      expect(interpreter.getVariable('ipv6Valid')).toBe(true);
      expect(interpreter.getVariable('ipv6Short')).toBe(true);
      expect(interpreter.getVariable('notIp')).toBe(false);
    });

    it('should validate MAC addresses', async () => {
      const script = `
        LET validMac1 = IS_MAC_ADDRESS mac="00:1B:44:11:3A:B7"
        LET validMac2 = IS_MAC_ADDRESS mac="00-1B-44-11-3A-B7"
        LET validMac3 = IS_MAC_ADDRESS mac="001b.4411.3ab7"
        LET invalidMac = IS_MAC_ADDRESS mac="00:1B:44:11:3A"
        LET notMac = IS_MAC_ADDRESS mac="hello world"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('validMac1')).toBe(true);
      expect(interpreter.getVariable('validMac2')).toBe(true);
      expect(interpreter.getVariable('validMac3')).toBe(true);
      expect(interpreter.getVariable('invalidMac')).toBe(false);
      expect(interpreter.getVariable('notMac')).toBe(false);
    });

    it('should validate string content properties', async () => {
      const script = `
        LET hasAlpha = IS_ALPHA text="HelloWorld"
        LET hasNumeric = IS_NUMERIC text="12345"
        LET hasAlphaNum = IS_ALPHANUMERIC text="Hello123"
        LET isLower = IS_LOWERCASE text="hello world"
        LET isUpper = IS_UPPERCASE text="HELLO WORLD"
        LET notAlpha = IS_ALPHA text="Hello 123!"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('hasAlpha')).toBe(true);
      expect(interpreter.getVariable('hasNumeric')).toBe(true);
      expect(interpreter.getVariable('hasAlphaNum')).toBe(true);
      expect(interpreter.getVariable('isLower')).toBe(true);
      expect(interpreter.getVariable('isUpper')).toBe(true);
      expect(interpreter.getVariable('notAlpha')).toBe(false);
    });

    it('should validate against custom patterns', async () => {
      const script = `
        LET matchesPattern = MATCHES_PATTERN text="abc123" pattern="^[a-z]+[0-9]+$"
        LET noMatch = MATCHES_PATTERN text="ABC123" pattern="^[a-z]+[0-9]+$"
        LET phonePattern = MATCHES_PATTERN text="555-1234" pattern="555-1234"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('matchesPattern')).toBe(true);
      expect(interpreter.getVariable('noMatch')).toBe(false);
      expect(interpreter.getVariable('phonePattern')).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const script = `
        LET emailResult = IS_EMAIL email=null
        LET urlResult = IS_URL url=undefined
        LET phoneResult = IS_PHONE phone=""
        LET numberResult = IS_NUMBER value="not-a-number"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      // All should return false for invalid inputs
      expect(interpreter.getVariable('emailResult')).toBe(false);
      expect(interpreter.getVariable('urlResult')).toBe(false);
      expect(interpreter.getVariable('phoneResult')).toBe(false);
      expect(interpreter.getVariable('numberResult')).toBe(false);
    });
  });
  
  describe('Math/Calculation Functions', () => {
    it('should perform basic math operations', async () => {
      const script = `
        LET absoluteValue = MATH_ABS value="-42.5"
        LET ceilValue = MATH_CEIL value="3.14"
        LET floorValue = MATH_FLOOR value="3.89"
        LET roundedValue = MATH_ROUND value="3.14159" precision="2"
        LET squareRoot = MATH_SQRT value="25"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('absoluteValue')).toBe(42.5);
      expect(interpreter.getVariable('ceilValue')).toBe(4);
      expect(interpreter.getVariable('floorValue')).toBe(3);
      expect(interpreter.getVariable('roundedValue')).toBe(3.14);
      expect(interpreter.getVariable('squareRoot')).toBe(5);
    });

    it('should perform aggregate math operations', async () => {
      const script = `
        LET maxValue = MATH_MAX a="10" b="25" c="15"
        LET minValue = MATH_MIN a="10" b="25" c="15"
        LET sumValue = MATH_SUM a="10" b="25" c="15"
        LET avgValue = MATH_AVERAGE a="10" b="20" c="30"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('maxValue')).toBe(25);
      expect(interpreter.getVariable('minValue')).toBe(10);
      expect(interpreter.getVariable('sumValue')).toBe(50);
      expect(interpreter.getVariable('avgValue')).toBe(20);
    });

    it('should perform advanced math operations', async () => {
      const script = `
        LET powerValue = MATH_POWER base="2" exponent="3"
        LET logValue = MATH_LOG value="100" base="10"
        LET factorial5 = MATH_FACTORIAL value="5"
        LET gcdValue = MATH_GCD a="48" b="18"
        LET lcmValue = MATH_LCM a="12" b="8"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('powerValue')).toBe(8);
      expect(interpreter.getVariable('logValue')).toBe(2);
      expect(interpreter.getVariable('factorial5')).toBe(120);
      expect(interpreter.getVariable('gcdValue')).toBe(6);
      expect(interpreter.getVariable('lcmValue')).toBe(24);
    });

    it('should perform trigonometric functions', async () => {
      const script = `
        LET sinValue = MATH_SIN value="90" unit="degrees"
        LET cosValue = MATH_COS value="0" unit="degrees"
        LET tanValue = MATH_TAN value="45" unit="degrees"
        LET sinRadians = MATH_SIN value="1.5708" unit="radians"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(Math.abs(interpreter.getVariable('sinValue') - 1)).toBeLessThan(0.0001);
      expect(Math.abs(interpreter.getVariable('cosValue') - 1)).toBeLessThan(0.0001);
      expect(Math.abs(interpreter.getVariable('tanValue') - 1)).toBeLessThan(0.0001);
      expect(Math.abs(interpreter.getVariable('sinRadians') - 1)).toBeLessThan(0.0001);
    });

    it('should perform utility math operations', async () => {
      const script = `
        LET clampedValue = MATH_CLAMP value="150" min="0" max="100"
        LET percentageValue = MATH_PERCENTAGE value="25" total="200"
        LET randomInt = MATH_RANDOM_INT min="1" max="10"
        LET distance2D = MATH_DISTANCE_2D x1="0" y1="0" x2="3" y2="4"
        LET angle2D = MATH_ANGLE_2D x1="0" y1="0" x2="1" y2="1" unit="degrees"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('clampedValue')).toBe(100);
      expect(interpreter.getVariable('percentageValue')).toBe(12.5);
      const randomResult = interpreter.getVariable('randomInt');
      expect(randomResult).toBeGreaterThanOrEqual(1);
      expect(randomResult).toBeLessThanOrEqual(10);
      expect(interpreter.getVariable('distance2D')).toBe(5);
      expect(Math.abs(interpreter.getVariable('angle2D') - 45)).toBeLessThan(0.0001);
    });

    it('should throw on invalid math operations', async () => {
      const script1 = `LET sqrtNegative = MATH_SQRT value="-1"`;
      const script2 = `LET absInvalid = MATH_ABS value="not-a-number"`;
      
      const commands1 = parse(script1);
      const commands2 = parse(script2);
      const interpreter = new Interpreter(addressSender);
      
      await expect(interpreter.run(commands1)).rejects.toThrow('Cannot calculate square root of negative number');
      await expect(interpreter.run(commands2)).rejects.toThrow('Cannot calculate absolute value');
    });
  });
  
  describe('Date/Time Functions', () => {
    it('should get current date and time', async () => {
      const script = `
        LET currentDate = NOW
        LET currentTimestamp = NOW_TIMESTAMP
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const currentDate = interpreter.getVariable('currentDate');
      const currentTimestamp = interpreter.getVariable('currentTimestamp');
      
      expect(typeof currentDate).toBe('string');
      expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(typeof currentTimestamp).toBe('number');
      expect(currentTimestamp).toBeGreaterThan(0);
    });

    it('should work with date operations', async () => {
      const script = `
        LET testDate = "2024-03-15"
        LET isWeekend = DATE_IS_WEEKEND date=testDate
        LET isBusiness = DATE_IS_BUSINESS_DAY date=testDate
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const isWeekend = interpreter.getVariable('isWeekend');
      const isBusiness = interpreter.getVariable('isBusiness');
      
      expect(typeof isWeekend === 'boolean').toBe(true);
      expect(typeof isBusiness === 'boolean').toBe(true);
    });

    it('should calculate basic date properties', async () => {
      const script = `
        LET testDate = "2024-07-15T00:00:00Z"
        LET quarter = DATE_QUARTER date=testDate
        LET age = DATE_AGE birthDate="1990-01-01"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('quarter')).toBe(3);
      const ageResult = interpreter.getVariable('age');
      expect(typeof ageResult === 'number').toBe(true);
      expect(ageResult).toBeGreaterThan(30);
    });

    it('should handle basic date operations', async () => {
      const script = `
        LET currentTime = NOW
        LET timestamp = NOW_TIMESTAMP
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const currentTime = interpreter.getVariable('currentTime');
      const timestamp = interpreter.getVariable('timestamp');
      
      expect(typeof currentTime === 'string').toBe(true);
      expect(typeof timestamp === 'number').toBe(true);
      expect(currentTime.length).toBeGreaterThan(0);
      expect(timestamp).toBeGreaterThan(0);
    });
  });
  
  describe('Security & Hashing Functions', () => {
    it('should encode and decode base64', async () => {
      const script = `
        LET text = "Hello World!"
        LET encoded = BASE64_ENCODE text=text
        LET decoded = BASE64_DECODE encoded=encoded
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('encoded')).toBe('SGVsbG8gV29ybGQh');
      expect(interpreter.getVariable('decoded')).toBe('Hello World!');
    });

    it('should generate random strings', async () => {
      const script = `
        LET randomHex = RANDOM_STRING length=16 charset="hex"
        LET randomAlpha = RANDOM_STRING length=10 charset="alpha"
        LET randomNumeric = RANDOM_STRING length=8 charset="numeric"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const hex = interpreter.getVariable('randomHex');
      const alpha = interpreter.getVariable('randomAlpha');
      const numeric = interpreter.getVariable('randomNumeric');
      
      expect(hex).toMatch(/^[0-9a-f]{16}$/);
      expect(alpha).toMatch(/^[A-Za-z]{10}$/);
      expect(numeric).toMatch(/^[0-9]{8}$/);
    });

    it('should create URL-safe base64', async () => {
      const script = `
        LET text = "Hello+World/Test=="
        LET urlSafe = URL_SAFE_BASE64 text=text
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('urlSafe');
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should decode JWT tokens', async () => {
      // Sample JWT with known payload
      const script = `
        LET token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        LET decoded = JWT_DECODE token=token
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const result = interpreter.getVariable('decoded');
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.payload).toEqual({ 
        sub: '1234567890', 
        name: 'John Doe', 
        iat: 1516239022 
      });
      expect(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('should handle security function errors gracefully', async () => {
      const script = `
        LET invalidJWT = JWT_DECODE token="not.a.jwt"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      const jwtResult = interpreter.getVariable('invalidJWT');
      expect(jwtResult.error).toBeDefined();
    });

  });


  describe('String Concatenation', () => {
    it('should handle string concatenation in SAY statements', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `
        LET name = "World"
        SAY "Hello " || name || "!"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Hello World!')).toBe(true);
    });
    
    it('should handle string concatenation in LET assignments', async () => {
      const script = `
        LET first = "Hello"
        LET second = "World"
        LET result = first || " " || second
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('result')).toBe('Hello World');
    });
    
    it('should use TestOutputHandler for cleaner test assertions', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `
        LET name = "TestHandler"
        SAY "Using " || name || " for clean testing!"
      `;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Using TestHandler for clean testing!')).toBe(true);
      expect(testOutput.getOutputCount()).toBe(1);
      expect(testOutput.getLastOutput()).toBe('Using TestHandler for clean testing!');
    });
    
    it('should handle concatenation with numbers', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `LET count = 42
SAY "Count is: " || count`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Count is: 42')).toBe(true);
    });
    
    it('should handle multiple concatenations in SAY', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `LET first = "Hello"
LET second = "beautiful"  
LET third = "world"
SAY first || " " || second || " " || third || "!"`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Hello beautiful world!')).toBe(true);
    });
    
    it('should handle concatenation with undefined variables', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `SAY "Result: " || undefined_var || " end"`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Result: undefined_var end')).toBe(true);
    });
    
    it('should handle concatenation in IF conditions', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `LET name = "test"
LET message = "Hello " || name
IF message = "Hello test" THEN
  SAY "Match found"
ENDIF`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Match found')).toBe(true);
    });
    
    it('should handle concatenation in DO loops', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `DO i = 1 TO 3
  SAY "Loop " || i
END`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.getOutputAt(0)).toBe('Loop 1');
      expect(testOutput.getOutputAt(1)).toBe('Loop 2');
      expect(testOutput.getOutputAt(2)).toBe('Loop 3');
      expect(testOutput.getOutputCount()).toBe(3);
    });
    
    it('should handle SAY concatenation inside RETRY_ON_STALE blocks', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `LET attempt_count = 0

RETRY_ON_STALE timeout=5000 PRESERVE attempt_count
  LET attempt_count = attempt_count + 1
  SAY "Attempt " || attempt_count
END_RETRY`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Attempt 1')).toBe(true);
    });
    
    it('should handle SAY concatenation with DOM variables inside RETRY_ON_STALE', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `RETRY_ON_STALE timeout=5000
  LET btn_text = "Submit"
  SAY "Button text: " || btn_text
END_RETRY`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(testOutput.hasOutput('Button text: Submit')).toBe(true);
    });
    
    it('should handle RETRY_ON_STALE with PRESERVE and concatenation', async () => {
      const { TestOutputHandler } = require('../src/output/test-output-handler');
      const testOutput = new TestOutputHandler();
      
      const script = `LET total_attempts = 0
LET success_message = ""

RETRY_ON_STALE timeout=5000 PRESERVE total_attempts,success_message
  LET total_attempts = total_attempts + 1
  LET success_message = "Completed after " || total_attempts || " attempts"
END_RETRY

SAY success_message`;
      
      const commands = parse(script);
      const interpreter = new Interpreter(addressSender, testOutput);
      await interpreter.run(commands);
      
      expect(interpreter.getVariable('total_attempts')).toBe(1);
      expect(interpreter.getVariable('success_message')).toBe('Completed after 1 attempts');
      expect(testOutput.hasOutput('Completed after 1 attempts')).toBe(true);
    });
  });
});