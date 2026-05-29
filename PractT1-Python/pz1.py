def sum_of_two():
    a = int(input("Enter the first number: "))
    b = int(input("Enter the second number: "))
    result = a + b
    print(f"The sum of {a} and {b} is: {result}")

def is_even():
    num = int(input("Enter a number: "))
    if num % 2 == 0:
        print(f"{num} is an even number.")
    else:
        print(f"{num} is an odd number.")

class Calculator:
    def add(self, x, y):
        return x + y

    def subtract(self, x, y):
        return x - y

    def multiply(self, x, y):
        return x * y

    def divide(self, x, y):
        if y != 0:
            return x / y
        else:
            return "Cannot divide by zero."
        
class Library:
    def __init__(self):
        self.books = []

    def add_book(self, title):
        self.books.append(title)
        print(f"'{title}' has been added to the library.")

    def remove_book(self, title):
        if title in self.books:
            self.books.remove(title)
            print(f"'{title}' has been removed from the library.")
        else:
            print(f"'{title}' is not found in the library.")

    def list_books(self):
        if self.books:
            print("Books in the library:")
            for book in self.books:
                print(f"- {book}")
        else:
            print("The library is empty.")

def main():
    print("pz1")
    while True:
        print("\nChoose an option:")
        print("1. Sum of two numbers")
        print("2. Check if a number is even or odd")
        print("3. Use the calculator")
        print("4. Manage the library")
        print("5. Exit")

        choice = input("Enter your choice: ")

        if choice == '1':
            sum_of_two()
        elif choice == '2':
            is_even()
        elif choice == '3':
            calc = Calculator()
            x = float(input("Enter the first number: "))
            y = float(input("Enter the second number: "))
            print(f"Addition: {calc.add(x, y)}")
            print(f"Subtraction: {calc.subtract(x, y)}")
            print(f"Multiplication: {calc.multiply(x, y)}")
            print(f"Division: {calc.divide(x, y)}")
        elif choice == '4':
            library = Library()
            while True:
                print("\nLibrary Management:")
                print("a. Add a book")
                print("b. Remove a book")
                print("c. List all books")
                print("d. Back to main menu")

                lib_choice = input("Enter your choice: ")

                if lib_choice == 'a':
                    title = input("Enter the book title: ")
                    library.add_book(title)
                elif lib_choice == 'b':
                    title = input("Enter the book title to remove: ")
                    library.remove_book(title)
                elif lib_choice == 'c':
                    library.list_books()
                elif lib_choice == 'd':
                    break
                else:
                    print("Invalid choice. Try again.")
        elif choice == '5':
            print("Goodbye!")
            break
        else:
            print("Invalid choice. Try again.")

if __name__ == "__main__":
    main()