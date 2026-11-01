# Impulse unit converter - inspired by the Mars Climate Orbiter mishap (1999)
# One team gave impulse in pound-force seconds (lbf*s),
# the other team expected newton seconds (N*s). Nobody converted.

LBF_S_TO_N_S = 4.44822  # 1 lbf*s equals 4.44822 N*s

# Input: read the value as text, then convert it to a number (float)
impulse_text = input("Thruster impulse in pound-force seconds (lbf*s), e.g. 10: ")
impulse_lbf_s = float(impulse_text)

# Processing: the correct conversion (arithmetic expression)
impulse_n_s = impulse_lbf_s * LBF_S_TO_N_S

# The mistake: using the number as if it were already in N*s
wrong_value_n_s = impulse_lbf_s
error_ratio = impulse_n_s / wrong_value_n_s

# Output: always show the unit next to every number
print(f"Value entered:          {impulse_lbf_s:.2f} lbf*s")
print(f"Correct value:          {impulse_n_s:.2f} N*s")
print(f"Value used by mistake:  {wrong_value_n_s:.2f} N*s")
print(f"The real effect was {error_ratio:.2f} times bigger than the software thought.")
