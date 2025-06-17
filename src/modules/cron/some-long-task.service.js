export class SomeLongTasksService {
  async task1() {
    console.log("Task1 is running");
    await this.delay(120000);
    console.log("Task1 is completed");
    return;
  }

  async task2() {
    console.log("Task2 is running");
    await this.delay(120000);
    console.log("Task2 is completed");
    return;
  }

  async task3() {
    console.log("Task3 is running");
    await this.delay(120000);
    console.log("Task3 is completed");
    return;
  }

  async task4() {
    console.log("Task4 is running");
    await this.delay(120000);
    console.log("Task4 is completed");
    return;
  }

  async task5() {
    console.log("Task5 is running");
    await this.delay(120000);
    console.log("Task5 is completed");
    return;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const someLongTasksService = new SomeLongTasksService();
