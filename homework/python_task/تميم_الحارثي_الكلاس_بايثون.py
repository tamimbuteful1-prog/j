# ============================================================
# Canteen Invoice - برنامج فاتورة المقصف
# Student: Tamim Turki Al-Harthi
# Each section below is linked to a sub-problem from Part A:
#   SP1 = Read inputs
#   SP2 = Compute subtotal
#   SP3 = Compute discount
#   SP4 = Compute VAT and final total
#   SP5 = Print the invoice
# ============================================================

VAT_RATE = 15  # VAT in percent (fixed by the problem)

# ---------- SP1: Read inputs ----------
student_name = input("Student name: ")

sandwich_count_text = input("Number of sandwiches (whole number, e.g. 2): ")
print("Type before conversion:", type(sandwich_count_text))
sandwich_count = int(sandwich_count_text)          # explicit int() for counts
print("Type after conversion: ", type(sandwich_count))

sandwich_price = float(input("Sandwich price in SAR (e.g. 4.50): "))  # float() for prices
juice_count = int(input("Number of juices (whole number, e.g. 3): "))
juice_price = float(input("Juice price in SAR (e.g. 2.00): "))
discount_percent = float(input("Discount percent (e.g. 10 means 10%): "))

# ---------- SP2: Compute subtotal ----------
sandwiches_cost = sandwich_count * sandwich_price
juices_cost = juice_count * juice_price
subtotal = sandwiches_cost + juices_cost

# ---------- SP3: Compute discount ----------
# TODO: warn if discount > 50   (decision from the flowchart in Part C)
discount_amount = subtotal * (discount_percent / 100)
after_discount = subtotal - discount_amount

# ---------- SP4: Compute VAT and final total ----------
vat_amount = after_discount * (VAT_RATE / 100)
final_total = after_discount + vat_amount

# ---------- SP5: Print the invoice ----------
print()
print("----- Canteen Invoice -----")
print(f"Student: {student_name}")
discount_label = f"Discount ({discount_percent:g}%):"
vat_label = f"VAT ({VAT_RATE}%):"
print(f"{'Subtotal:':<20} {subtotal:.2f} SAR")
print(f"{discount_label:<20} {discount_amount:.2f} SAR")
print(f"{'After discount:':<20} {after_discount:.2f} SAR")
print(f"{vat_label:<20} {vat_amount:.2f} SAR")
print(f"{'Total:':<20} {final_total:.2f} SAR")
print("---------------------------")
