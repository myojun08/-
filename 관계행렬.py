# n x n 일반 크기 관계 행렬을 입력받아서
# 1) 반사, 대칭, 추이 여부 판별
# 2) 동치 관계면 동치류 출력
# 3) 아니면 반사/대칭/추이 폐포 (전/후) 출력
# 4) 세 폐포를 모두 적용한 동치 폐포 결과의 동치류 출력
# + 추가기능: 집합 크기를 n으로 일반화

def input_matrix(n):
    #NxN 입력받기
    print(f"{n}x{n} 관계 행렬을 입력하세요. (각 행에 0/1 {n}개, 공백으로 구분)")
    M = []
    for i in range(n):
        while True:
            row = input(f"{i+1}번째 행: ").split()
            if len(row) != n:
                print("원소 개수 다름")
                continue
            try:
                row = [int(x) for x in row]
            except ValueError:
                print("0과 1만 입력하세요.")
                continue
            if any(x not in (0, 1) for x in row):
                print("과 1만 입력하세요.")
                continue
            M.append(row)
            break
    return M


def print_matrix(M, title=None):
    #행렬 출력
    if title:
        print(f"\n[{title}]")
    n = len(M)
    print("    " + " ".join(f"{j+1}" for j in range(n)))
    print("   " + "-" * (2 * n - 1))
    for i, row in enumerate(M):
        print(f"{i+1} | " + " ".join(str(x) for x in row))


def is_reflexive(M):
    n = len(M)
    for i in range(n):
        if M[i][i] != 1:
            return False
    return True


def is_symmetric(M):
    n = len(M)
    for i in range(n):
        for j in range(n):
            if M[i][j] == 1 and M[j][i] != 1:
                return False
    return True


def is_transitive(M):
    n = len(M)
    for i in range(n):
        for j in range(n):
            if M[i][j] == 1:
                for k in range(n):
                    if M[j][k] == 1 and M[i][k] != 1:
                        return False
    return True


def reflexive_closure(M):
    n = len(M)
    R = [row[:] for row in M]
    for i in range(n):
        R[i][i] = 1
    return R
    

def symmetric_closure(M):
    n = len(M)
    R = [row[:] for row in M]
    for i in range(n):
        for j in range(n):
            if R[i][j] == 1:
                R[j][i] = 1
    return R


def transitive_closure(M):
    n = len(M)
    R = [row[:] for row in M]
    for k in range(n):
        for i in range(n):
            if R[i][k] == 1:
                for j in range(n):
                    if R[k][j] == 1:
                        R[i][j] = 1
    return R


def equivalence_closure(M):
    return transitive_closure(symmetric_closure(reflexive_closure(M)))


def print_equivalence_classes(M):
    n = len(M)
    A = [i + 1 for i in range(n)]
    print("\n[동치류 출력]")
    for i in range(n):
        eq_class = [A[j] for j in range(n) if M[i][j] == 1]
        print(f"[{A[i]}] = {eq_class}")


def check_and_print_properties(M, label="[현재 관계]"):
    print(f"\n{label} 성질 판별:")
    r = is_reflexive(M)
    s = is_symmetric(M)
    t = is_transitive(M)
    print(f"  반사적  : {r}")
    print(f"  대칭적  : {s}")
    print(f"  추이적  : {t}")
    return r, s, t


def main():
    # 1) n 입력
    n = int(input("집합 크기 n을 입력하세요: "))
    print(f"집합 A = {{1, 2, ..., {n}}}")

    # 2) 관계 행렬 입력
    M = input_matrix(n)
    print_matrix(M, "입력된 관계 행렬")

    # 3) 성질 판별 (딱 1번)
    r, s, t = check_and_print_properties(M)

    # =============================
    # 동치 관계이면 즉시 종료
    # =============================
    if r and s and t:
        print("\n=> 이 관계는 동치 관계입니다.")
        print_equivalence_classes(M)
        return   # <-- 종료!!!

    # =============================
    # 동치 관계가 아닌 경우만 폐포 진행
    # =============================
    print("\n=> 이 관계는 동치 관계가 아닙니다.\n")

    # --- 반사적 폐포 ---
    R_ref = reflexive_closure(M)
    print_matrix(M, "반사적 폐포 변환 전")
    print_matrix(R_ref, "반사적 폐포 변환 후")

    # --- 대칭적 폐포 ---
    R_sym = symmetric_closure(M)
    print_matrix(M, "대칭적 폐포 변환 전")
    print_matrix(R_sym, "대칭적 폐포 변환 후")

    # --- 추이적 폐포 ---
    R_tra = transitive_closure(M)
    print_matrix(M, "추이적 폐포 변환 전")
    print_matrix(R_tra, "추이적 폐포 변환 후")

    # --- 동치 폐포 ---
    R_eq = equivalence_closure(M)
    print_matrix(R_eq, "동치 폐포 결과")

    # 동치 폐포에 대해 딱 1번만 판별
    r2, s2, t2 = check_and_print_properties(R_eq, "[동치 폐포 결과]")

    if r2 and s2 and t2:
        print("\n=> 동치 폐포 결과는 동치 관계입니다.")
        print_equivalence_classes(R_eq)



if __name__ == "__main__":
    main()
